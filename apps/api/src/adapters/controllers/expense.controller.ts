import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../../infrastructure/middleware/auth';
import { ScanExpenseReceipt } from '../../use-cases/ScanExpenseReceipt';
import prisma from '../../infrastructure/database';

const router = Router();
const scanner = new ScanExpenseReceipt();

const scanSchema = z.object({
  receiptText: z.string().min(1),
  tripId: z.string().optional(),
});

router.post('/scan', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = scanSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' });
      return;
    }

    const result = await scanner.execute({
      receiptText: parsed.data.receiptText,
      lang: req.lang || 'en',
    });

    const expense = await prisma.expense.create({
      data: {
        userId: req.userId!,
        tripId: parsed.data.tripId || null,
        amount: result.amount,
        currency: result.currency,
        category: result.category,
        description: result.description,
        receiptText: parsed.data.receiptText,
      },
    });

    res.json({ expense, extracted: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to scan receipt', code: 'SERVER_ERROR' });
  }
});

router.get('/list', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tripId = req.query.tripId as string | undefined;
    const where: any = { userId: req.userId };
    if (tripId) where.tripId = tripId;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = expenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    res.json({ expenses, total, byCategory });
  } catch {
    res.status(500).json({ error: 'Failed to fetch expenses', code: 'SERVER_ERROR' });
  }
});

// POST /api/expense — add expense manually
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      amount: z.number().positive(),
      currency: z.string().default('USD'),
      category: z.string(),
      description: z.string().default(''),
      tripId: z.string().optional(),
    });
    const parsed = schema.parse(req.body);
    const expense = await prisma.expense.create({
      data: {
        userId: req.userId!,
        tripId: parsed.tripId || null,
        amount: parsed.amount,
        currency: parsed.currency,
        category: parsed.category,
        description: parsed.description,
      },
    });
    res.status(201).json({ expense });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.issues[0].message, code: 'VALIDATION_ERROR' });
    }
    res.status(500).json({ error: 'Failed to add expense', code: 'SERVER_ERROR' });
  }
});

// DELETE /api/expense/:id — delete an expense
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense || expense.userId !== req.userId) {
      return res.status(404).json({ error: 'Expense not found', code: 'NOT_FOUND' });
    }
    await prisma.expense.delete({ where: { id } });
    res.json({ message: 'Expense deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete expense', code: 'SERVER_ERROR' });
  }
});

export default router;
