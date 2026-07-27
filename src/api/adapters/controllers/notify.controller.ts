import { Router, Response } from 'express';
import { NotificationPipeline } from '../services/NotificationPipeline';

const router = Router();
const notifyPipeline = new NotificationPipeline();

router.post('/sms/test', async (req, res: Response) => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ error: 'Phone number required' });
    return;
  }
  const success = await notifyPipeline.sendSMS(phone, 'Test SMS from Disruption Concierge');
  res.json({ success });
});

router.post('/whatsapp/test', async (req, res: Response) => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ error: 'Phone number required' });
    return;
  }
  const success = await notifyPipeline.sendWhatsApp(phone, 'test_id', 'TEST-123', { flightNumber: 'ALT-123' });
  res.json({ success });
});

export default router;
