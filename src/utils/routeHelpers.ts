import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Обертка для асинхронных обработчиков маршрутов, позволяющая 
 * избежать блокировки на await и перехватывать ошибки
 * @param fn Асинхронная функция-обработчик
 * @returns Функция-обработчик, совместимая с Express
 */
export const asyncHandler = (fn: any): RequestHandler => 
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  }; 