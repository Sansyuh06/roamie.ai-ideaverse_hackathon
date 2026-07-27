import { PrismaClient } from '@prisma/client';
import { IFlightService } from '../domain/interfaces';
import { AviationStackService } from '../adapters/services/AviationStackService';
import { PolicyEngine } from './PolicyEngine';
import { RankingEngine } from './RankingEngine';
import { ReasoningEngine } from './ReasoningEngine';
import { NotificationPipeline } from '../adapters/services/NotificationPipeline';

const prisma = new PrismaClient();

export class TriggerDisruptionShield {
  constructor(
    private flightService: IFlightService,
    private aviationStack: AviationStackService,
    private notifyPipeline: NotificationPipeline
  ) {}

  async execute(params: {
    tripId: string;
    flightId: string;
    disruptionType: 'cancelled' | 'delayed' | 'missed';
  }): Promise<{ disruptionId: string; message: string }> {
    
    // 1. Load Trip & User
    const trip = await prisma.trip.findUnique({
      where: { id: params.tripId },
      include: { user: true }
    });
    if (!trip) throw new Error('Trip not found');

    const flight = await prisma.flightBooking.findUnique({
      where: { id: params.flightId }
    });
    if (!flight) throw new Error('Flight not found');

    // 2. Create initial Disruption record
    const disruption = await prisma.disruption.create({
      data: {
        tripId: params.tripId,
        flightId: params.flightId,
        type: params.disruptionType,
        source1: 'amadeus',
        source1Status: 'pending',
        source2: 'aviationstack',
        source2Status: 'pending'
      }
    });

    await prisma.auditEntry.create({
      data: { disruptionId: disruption.id, event: 'disruption_detected', detail: `Detected ${params.disruptionType} for ${flight.flightNumber}` }
    });

    // 3. Confirm with Amadeus & AviationStack
    const [amadeusStatus, aviationStatus] = await Promise.all([
      this.flightService.checkStatus ? this.flightService.checkStatus(flight.airline, flight.flightNumber, flight.departureTime) : Promise.resolve({ status: 'unknown' }),
      this.aviationStack.checkStatus(flight.flightNumber)
    ]);

    await prisma.disruption.update({
      where: { id: disruption.id },
      data: {
        source1Status: amadeusStatus.status,
        source2Status: aviationStatus.status,
        status: 'confirmed', // Assuming confirmed for demo purposes
        confirmedAt: new Date()
      }
    });

    await prisma.auditEntry.create({
      data: { disruptionId: disruption.id, event: 'sources_cross_referenced', detail: `Amadeus: ${amadeusStatus.status}, AviationStack: ${aviationStatus.status}` }
    });

    // 4. Search Alternatives
    const alternatives = await this.flightService.findAlternatives(
      flight.origin,
      flight.destination,
      flight.departureTime,
      { originalPrice: flight.price }
    );

    await prisma.auditEntry.create({
      data: { disruptionId: disruption.id, event: 'amadeus_search_triggered', detail: `Found ${alternatives.length} raw flights` }
    });

    // 5. Apply Policy Filter
    const cardTier = trip.user.cardTier || 'gold';
    const { valid, excluded } = PolicyEngine.filterAlternatives(alternatives, cardTier);

    await prisma.auditEntry.create({
      data: { disruptionId: disruption.id, event: 'policy_filter_applied', detail: `${excluded.length} flights excluded by ${cardTier} policy` }
    });

    // 6. Rank Alternatives
    const ranked = RankingEngine.rank(valid, flight.arrivalTime, flight.price);
    const top3 = ranked.slice(0, 3);

    await prisma.auditEntry.create({
      data: { disruptionId: disruption.id, event: 'alternatives_ranked', detail: `Top pick: ${top3[0]?.flightNumber}` }
    });

    // 7. Save Alternatives to DB
    const holdExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    
    for (let i = 0; i < top3.length; i++) {
      await prisma.alternative.create({
        data: {
          disruptionId: disruption.id,
          flightNumber: top3[i].flightNumber,
          airline: top3[i].airline,
          origin: top3[i].origin,
          destination: top3[i].destination,
          departureTime: top3[i].departureTime,
          arrivalTime: top3[i].arrivalTime,
          price: top3[i].price,
          seatClass: top3[i].seatClass,
          utilityScore: top3[i].utilityScore,
          rank: i + 1,
          holdExpiresAt: holdExpiry
        }
      });
    }

    for (const ex of excluded) {
      await prisma.alternative.create({
        data: {
          disruptionId: disruption.id,
          flightNumber: ex.flightNumber,
          airline: ex.airline,
          origin: ex.origin,
          destination: ex.destination,
          departureTime: ex.departureTime,
          arrivalTime: ex.arrivalTime,
          price: ex.price,
          seatClass: ex.seatClass,
          utilityScore: 0,
          rank: 99,
          excluded: true,
          exclusionReason: ex.exclusionReason,
          holdExpiresAt: holdExpiry
        }
      });
    }

    // 8. Generate Reasoning
    const reasoning = ReasoningEngine.generate(
      { flightNumber: flight.flightNumber, status: params.disruptionType },
      alternatives.length,
      top3,
      excluded,
      cardTier
    );

    // Save reasoning in disruption resolution field for now
    await prisma.disruption.update({
      where: { id: disruption.id },
      data: { resolution: JSON.stringify({ reasoning }), status: 'awaiting_confirmation' }
    });

    // 9. Send Notifications
    if (trip.user.phone) {
      const smsBody = `AMEX: Flight ${flight.flightNumber} to ${flight.destination} ${params.disruptionType}. Open the app or check WhatsApp for rebooking options. Ref: ${disruption.id}`;
      await this.notifyPipeline.sendSMS(trip.user.phone, smsBody);
      await prisma.auditEntry.create({
        data: { disruptionId: disruption.id, event: 'user_notified_sms', detail: 'SMS sent' }
      });
    }

    if (trip.user.phone && trip.user.whatsappEnabled) {
      await this.notifyPipeline.sendWhatsApp(trip.user.phone, disruption.id, flight.flightNumber, top3[0]);
      await prisma.auditEntry.create({
        data: { disruptionId: disruption.id, event: 'user_notified_whatsapp', detail: 'WhatsApp rich card sent' }
      });
    }

    return { disruptionId: disruption.id, message: 'Pipeline executed successfully' };
  }
}

