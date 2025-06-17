import express from 'express';
import * as authController from '../controllers/auth.controller';
import * as subjectController from '../controllers/subjectController'; // Добавляем импорт контроллера предметов
import { asyncHandler } from '../utils/routeHelpers';

const router = express.Router();

// Маршруты аутентификации
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));

// Маршрут для получения списка предметов
router.get('/subjects', asyncHandler(subjectController.getSubjects));

export default router;