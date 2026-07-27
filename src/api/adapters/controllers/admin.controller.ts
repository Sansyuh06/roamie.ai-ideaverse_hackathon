import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../../infrastructure/database';
import { authMiddleware, AuthRequest } from '../../infrastructure/middleware/auth';

const router = Router();

const injectSchema = z.object({
  tripId: z.string().min(1),
  flightId: z.string().min(1),
  disruptionType: z.enum(['cancelled', 'delayed'])
});

// Inject disruption (Bypasses real monitoring for the demo)
router.post('/inject-disruption', authMiddleware, async (req: AuthRequest, res: Response) => {
  // In production, this would be restricted to admins
  // if (!req.user.isAdmin) return res.status(403);

  try {
    const parsed = injectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' });
      return;
    }

    // Update flight status to simulate disruption detection
    await prisma.flightBooking.update({
      where: { id: parsed.data.flightId },
      data: { status: parsed.data.disruptionType }
    });

    res.json({ message: 'Disruption injected', ...parsed.data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to inject disruption' });
  }
});

// Reset demo state
router.post('/reset', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Clean up disruptions, alternatives, and audit entries for the user's trips
    const trips = await prisma.trip.findMany({ where: { userId: req.userId } });
    const tripIds = trips.map(t => t.id);

    await prisma.disruption.deleteMany({
      where: { tripId: { in: tripIds } }
    });

    await prisma.flightBooking.updateMany({
      where: { tripId: { in: tripIds } },
      data: { status: 'confirmed' }
    });

    res.json({ message: 'Demo state reset' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset demo state' });
  }
});

export default router;
