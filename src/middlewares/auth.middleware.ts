import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Расширение интерфейса Request для добавления пользователя
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

interface JwtPayload {
  id: string;
  role: string;
}

// Middleware для проверки авторизации по JWT токену
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ 
        message: 'Доступ запрещен. Токен не предоставлен' 
      });
      return;
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default_secret'
      ) as JwtPayload;

      req.user = {
        id: decoded.id,
        role: decoded.role
      };

      next();
    } catch (error) {
      res.status(401).json({ 
        message: 'Неверный или устаревший токен' 
      });
      return;
    }
  } catch (error) {
    console.error('Error in auth middleware:', error);
    res.status(500).json({ 
      message: 'Ошибка сервера при аутентификации' 
    });
    return;
  }
};

// Middleware для проверки роли пользователя
export const roleMiddleware = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        message: 'Доступ запрещен. Пользователь не аутентифицирован' 
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        message: 'Доступ запрещен. Недостаточно прав' 
      });
      return;
    }

    next();
  };
}; 