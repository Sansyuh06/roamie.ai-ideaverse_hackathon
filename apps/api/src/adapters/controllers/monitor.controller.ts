import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../infrastructure/middleware/auth';
import { FlightMonitorService, NotificationService } from '../services/FlightMonitorService';

const router = Router();

// Singleton instances
const notificationService = new NotificationService();
const monitorService = new FlightMonitorService(undefined, notificationService);

// POST /api/monitor/enable — Enable monitoring for a trip's flight
router.post('/enable', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { tripId, flightId } = req.body;
    if (!tripId || !flightId) {
      res.status(400).json({ error: 'tripId and flightId required', code: 'VALIDATION_ERROR' });
      return;
    }
    monitorService.enableMonitoring(tripId, flightId, req.userId!);
    res.json({ message: 'Monitoring enabled', tripId, flightId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enable monitoring', code: 'SERVER_ERROR' });
  }
});

// POST /api/monitor/disable — Disable monitoring
router.post('/disable', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { tripId, flightId } = req.body;
    if (!tripId) {
      res.status(400).json({ error: 'tripId required', code: 'VALIDATION_ERROR' });
      return;
    }
    monitorService.disableMonitoring(tripId, flightId);
    res.json({ message: 'Monitoring disabled', tripId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disable monitoring', code: 'SERVER_ERROR' });
  }
});

// GET /api/monitor/status/:tripId — Get monitoring status
router.get('/status/:tripId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const status = monitorService.getStatus(req.params.tripId as string);
    res.json({ monitors: status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status', code: 'SERVER_ERROR' });
  }
});

// GET /api/monitor/notifications/:tripId — Get notification history
router.get('/notifications/:tripId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = notificationService.getNotifications(req.params.tripId as string);
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get notifications', code: 'SERVER_ERROR' });
  }
});

export default router;
