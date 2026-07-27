import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../../infrastructure/middleware/auth';
import { TriggerDisruptionShield } from '../../use-cases/TriggerDisruptionShield';
import { AmadeusFlightService } from '../services/AmadeusFlightService';
import { AviationStackService } from '../services/AviationStackService';
import { NotificationPipeline } from '../services/NotificationPipeline';
import { AlternativeFlight } from '../../domain/entities';
import { disruptionLimiter } from '../../infrastructure/middleware/rateLimiter';
import prisma from '../../infrastructure/database';

const router = Router();
const flightService = new AmadeusFlightService();
const aviationStack = new AviationStackService();
const notifyPipeline = new NotificationPipeline();
const disruptionShield = new TriggerDisruptionShield(flightService, aviationStack, notifyPipeline);

const triggerSchema = z.object({
  tripId: z.string().min(1),
  flightId: z.string().min(1),
  disruptionType: z.enum(['cancelled', 'delayed', 'missed'])
});

// Trigger disruption (Now uses real Amadeus APIs via TriggerDisruptionShield)
router.post('/trigger', authMiddleware, disruptionLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = triggerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' });
      return;
    }

    const trip = await prisma.trip.findUnique({ where: { id: parsed.data.tripId } });
    if (!trip || trip.userId !== req.userId) {
      res.status(404).json({ error: 'Trip not found or unauthorized', code: 'NOT_FOUND' });
      return;
    }

    const resolution = await disruptionShield.execute({
      tripId: parsed.data.tripId,
      flightId: parsed.data.flightId,
      disruptionType: parsed.data.disruptionType
    });

    res.json(resolution);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: msg, code: 'SERVER_ERROR' });
  }
});

// Get disruption detail
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const disruption: any = await prisma.disruption.findUnique({
      where: { id: req.params.id as string },
      include: {
        alternatives: {
          orderBy: { rank: 'asc' }
        },
        trip: true
      }
    });

    if (!disruption) {
      res.status(404).json({ error: 'Disruption not found', code: 'NOT_FOUND' });
      return;
    }

    if (disruption.trip.userId !== req.userId) {
      res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
      return;
    }

    res.json({ disruption });
  } catch (error) {
    res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
});

// Confirm top alternative
router.post('/:id/confirm', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const disruption: any = await prisma.disruption.findUnique({
      where: { id: req.params.id as string },
      include: { alternatives: { where: { rank: 1 } }, trip: true }
    });

    if (!disruption || disruption.trip.userId !== req.userId) {
      res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
      return;
    }

    const alt = disruption.alternatives[0];
    if (!alt) {
      res.status(400).json({ error: 'No alternative to confirm', code: 'BAD_REQUEST' });
      return;
    }

    if (alt.holdExpiresAt < new Date()) {
      res.status(400).json({ error: 'Hold expired', code: 'EXPIRED' });
      return;
    }

    await prisma.alternative.update({ where: { id: alt.id }, data: { holdStatus: 'confirmed' } });
    await prisma.disruption.update({ where: { id: disruption.id }, data: { status: 'resolved', confirmedAt: new Date() } });
    await prisma.auditEntry.create({
      data: { disruptionId: disruption.id, event: 'user_confirmed', detail: `Confirmed ${alt.flightNumber}` }
    });

    res.json({ message: 'Confirmed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
});

// Choose a specific alternative
router.post('/:id/choose/:altId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const disruption: any = await prisma.disruption.findUnique({
      where: { id: req.params.id as string },
      include: { trip: true }
    });

    if (!disruption || disruption.trip.userId !== req.userId) {
      res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
      return;
    }

    const alt = await prisma.alternative.findUnique({ where: { id: req.params.altId as string } });
    if (!alt || alt.disruptionId !== disruption.id) {
      res.status(404).json({ error: 'Alternative not found', code: 'NOT_FOUND' });
      return;
    }

    if (alt.holdExpiresAt < new Date()) {
      res.status(400).json({ error: 'Hold expired', code: 'EXPIRED' });
      return;
    }

    await prisma.alternative.update({ where: { id: alt.id }, data: { holdStatus: 'confirmed' } });
    await prisma.disruption.update({ where: { id: disruption.id }, data: { status: 'resolved', confirmedAt: new Date() } });
    await prisma.auditEntry.create({
      data: { disruptionId: disruption.id, event: 'user_chose_different', detail: `User selected ${alt.flightNumber}` }
    });

    res.json({ message: 'Alternative chosen successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
});

// Get Audit Log
router.get('/:id/audit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const disruption: any = await prisma.disruption.findUnique({
      where: { id: req.params.id as string },
      include: { trip: true }
    });

    if (!disruption || disruption.trip.userId !== req.userId) {
      res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
      return;
    }

    const audit = await prisma.auditEntry.findMany({
      where: { disruptionId: disruption.id },
      orderBy: { timestamp: 'desc' }
    });

    res.json({ audit });
  } catch (error) {
    res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
});

export default router;
