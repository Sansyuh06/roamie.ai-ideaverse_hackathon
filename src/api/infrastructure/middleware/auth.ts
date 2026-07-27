import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  userId?: string;
  lang?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided', code: 'UNAUTHORIZED' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.SUPABASE_JWT_SECRET || config.JWT_SECRET;
    // Supabase payload structure uses 'sub' for the user ID
    const payload = jwt.verify(token, secret) as { sub?: string; userId?: string };
    req.userId = payload.sub || payload.userId; // Support both Supabase and legacy tokens
    
    if (!req.userId) {
      throw new Error('No user ID found in token');
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' });
  }
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const secret = process.env.SUPABASE_JWT_SECRET || config.JWT_SECRET;
      const payload = jwt.verify(token, secret) as { sub?: string; userId?: string };
      req.userId = payload.sub || payload.userId;
    } catch {
      // ignore, optional
    }
  }
  next();
}
