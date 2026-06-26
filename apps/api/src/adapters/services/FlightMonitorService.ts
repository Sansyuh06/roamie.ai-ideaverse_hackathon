import { IFlightService } from '../../domain/interfaces';
import { ItineraryPlan } from '../../domain/entities';

/**
 * Flight Status result from a mock or real flight status checker.
 */
export interface FlightStatusResult {
  flightNumber: string;
  status: 'scheduled' | 'delayed' | 'cancelled' | 'diverted' | 'landed';
  departureTime: string;
  arrivalTime: string;
  delay?: number; // minutes
  gate?: string;
  terminal?: string;
}

/**
 * Interface for checking real-time flight status.
 * Implementations can be mock (for demo) or real (AviationStack, etc.)
 */
export interface IFlightStatusService {
  checkStatus(flightNumber: string, departureDate: Date): Promise<FlightStatusResult>;
}

/**
 * MockFlightStatusService — simulates flight status changes for demo purposes.
 * Has a configurable cancellation probability (default 15%).
 */
export class MockFlightStatusService implements IFlightStatusService {
  private cancellationRate: number;
  private statusHistory: Map<string, FlightStatusResult> = new Map();

  constructor(cancellationRate = 0.15) {
    this.cancellationRate = cancellationRate;
  }

  async checkStatus(flightNumber: string, departureDate: Date): Promise<FlightStatusResult> {
    // Check if we already have a status for this flight (simulate persistence)
    const key = `${flightNumber}-${departureDate.toISOString().split('T')[0]}`;
    const existing = this.statusHistory.get(key);

    if (existing) {
      // Once cancelled, stays cancelled
      if (existing.status === 'cancelled') return existing;

      // Small chance of status change on each check
      if (Math.random() < 0.1) {
        const statuses: FlightStatusResult['status'][] = ['scheduled', 'delayed', 'cancelled'];
        const weights = [0.6, 0.25, this.cancellationRate];
        const roll = Math.random();
        let cumulative = 0;
        let newStatus: FlightStatusResult['status'] = 'scheduled';
        for (let i = 0; i < statuses.length; i++) {
          cumulative += weights[i];
          if (roll < cumulative) { newStatus = statuses[i]; break; }
        }
        existing.status = newStatus;
        if (newStatus === 'delayed') {
          existing.delay = Math.floor(Math.random() * 120) + 30; // 30-150 min delay
        }
        this.statusHistory.set(key, existing);
      }
      return existing;
    }

    // First check — generate initial status
    const roll = Math.random();
    let status: FlightStatusResult['status'] = 'scheduled';
    let delay: number | undefined;

    if (roll < this.cancellationRate) {
      status = 'cancelled';
    } else if (roll < this.cancellationRate + 0.15) {
      status = 'delayed';
      delay = Math.floor(Math.random() * 120) + 30;
    }

    const depTime = new Date(departureDate);
    depTime.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

    const arrTime = new Date(depTime);
    arrTime.setHours(arrTime.getHours() + 2 + Math.floor(Math.random() * 10));

    const result: FlightStatusResult = {
      flightNumber,
      status,
      departureTime: depTime.toISOString(),
      arrivalTime: arrTime.toISOString(),
      delay,
      gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 8))}${Math.floor(Math.random() * 30) + 1}`,
      terminal: `T${Math.floor(Math.random() * 3) + 1}`,
    };

    this.statusHistory.set(key, result);
    return result;
  }

  /**
   * Force a specific flight to be cancelled (for testing/demo).
   */
  forceCancellation(flightNumber: string, departureDate: Date): void {
    const key = `${flightNumber}-${departureDate.toISOString().split('T')[0]}`;
    const existing = this.statusHistory.get(key);
    if (existing) {
      existing.status = 'cancelled';
    } else {
      this.statusHistory.set(key, {
        flightNumber,
        status: 'cancelled',
        departureTime: departureDate.toISOString(),
        arrivalTime: departureDate.toISOString(),
      });
    }
  }
}

/**
 * NotificationService — Stub for sending notifications.
 * Can be extended with real WhatsApp (whatsapp-web.js), email, push, etc.
 */
export class NotificationService {
  private logs: Array<{
    id: string; userId: string; tripId: string;
    channel: string; type: string; message: string;
    status: string; createdAt: Date;
  }> = [];

  async notifyDisruption(userId: string, tripId: string, details: {
    flightNumber: string;
    destination: string;
    status: string;
  }): Promise<void> {
    const message = `🚨 Roamie Alert: Your flight ${details.flightNumber} to ${details.destination} has been ${details.status}. Check the Roamie app for alternatives!`;

    console.log(`[NotificationService] Sending to user ${userId}: ${message}`);

    this.logs.push({
      id: crypto.randomUUID(),
      userId,
      tripId,
      channel: 'in-app',
      type: 'disruption_alert',
      message,
      status: 'sent',
      createdAt: new Date(),
    });
  }

  async notifyEditConfirmation(userId: string, tripId: string, changes: string): Promise<void> {
    const message = `✅ Your itinerary for trip ${tripId} has been updated: ${changes}`;
    console.log(`[NotificationService] ${message}`);

    this.logs.push({
      id: crypto.randomUUID(),
      userId,
      tripId,
      channel: 'in-app',
      type: 'edit_confirm',
      message,
      status: 'sent',
      createdAt: new Date(),
    });
  }

  getNotifications(tripId: string) {
    return this.logs.filter(l => l.tripId === tripId);
  }
}

/**
 * FlightMonitorService — Background poller that periodically checks flight statuses.
 * On detection of cancellation → triggers notification + disruption shield.
 */
export class FlightMonitorService {
  private flightStatusService: IFlightStatusService;
  private notificationService: NotificationService;
  private monitors: Map<string, { tripId: string; flightId: string; userId: string; lastStatus: string }> = new Map();
  private interval: ReturnType<typeof setInterval> | null = null;
  private checkIntervalMs: number;

  constructor(
    flightStatusService?: IFlightStatusService,
    notificationService?: NotificationService,
    checkIntervalMs?: number,
  ) {
    this.flightStatusService = flightStatusService || new MockFlightStatusService();
    this.notificationService = notificationService || new NotificationService();
    this.checkIntervalMs = checkIntervalMs || parseInt(process.env.FLIGHT_MONITOR_INTERVAL_MS || '300000', 10);
  }

  enableMonitoring(tripId: string, flightId: string, userId: string): void {
    const key = `${tripId}:${flightId}`;
    this.monitors.set(key, { tripId, flightId, userId, lastStatus: 'scheduled' });
    console.log(`[FlightMonitor] Enabled monitoring for ${key}`);
    this.ensurePolling();
  }

  disableMonitoring(tripId: string, flightId?: string): void {
    if (flightId) {
      this.monitors.delete(`${tripId}:${flightId}`);
    } else {
      // Disable all monitors for this trip
      for (const key of this.monitors.keys()) {
        if (key.startsWith(`${tripId}:`)) this.monitors.delete(key);
      }
    }
    if (this.monitors.size === 0 && this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  getStatus(tripId: string): Array<{ flightId: string; lastStatus: string }> {
    const result: Array<{ flightId: string; lastStatus: string }> = [];
    for (const [key, val] of this.monitors.entries()) {
      if (val.tripId === tripId) {
        result.push({ flightId: val.flightId, lastStatus: val.lastStatus });
      }
    }
    return result;
  }

  private ensurePolling(): void {
    if (this.interval) return;
    this.interval = setInterval(() => this.pollAll(), this.checkIntervalMs);
    // Also do an immediate check
    this.pollAll();
  }

  private async pollAll(): Promise<void> {
    for (const [key, monitor] of this.monitors.entries()) {
      try {
        const result = await this.flightStatusService.checkStatus(monitor.flightId, new Date());
        if (result.status !== monitor.lastStatus) {
          console.log(`[FlightMonitor] Status change for ${monitor.flightId}: ${monitor.lastStatus} → ${result.status}`);
          monitor.lastStatus = result.status;

          if (result.status === 'cancelled' || result.status === 'diverted') {
            await this.notificationService.notifyDisruption(monitor.userId, monitor.tripId, {
              flightNumber: monitor.flightId,
              destination: 'your destination',
              status: result.status,
            });
          }
        }
      } catch (err) {
        console.warn(`[FlightMonitor] Error checking ${monitor.flightId}:`, err);
      }
    }
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
