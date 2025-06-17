import express from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

// Получение уведомлений для текущего пользователя
router.get('/', authMiddleware, notificationController.getUserNotifications);

// Получение количества непрочитанных уведомлений
router.get('/unread', authMiddleware, notificationController.getUnreadNotificationsCount);

// Отметить уведомление как прочитанное
router.patch('/:notificationId/read', authMiddleware, notificationController.markNotificationAsRead);

// Отметить все уведомления как прочитанные
router.patch('/read-all', authMiddleware, notificationController.markAllNotificationsAsRead);

// Удалить уведомление
router.delete('/:notificationId', authMiddleware, notificationController.deleteNotification);

// Обновить push-токен пользователя (для уведомлений на устройстве)
router.post('/push-token', authMiddleware, notificationController.updatePushToken);

// Создать уведомление (для тестирования и административных целей)
router.post('/', authMiddleware, roleMiddleware(['admin']), notificationController.createNotification);

// Создание напоминания о родительском собрании (требуется роль admin)
router.post('/parent-meeting', authMiddleware, roleMiddleware(['admin']), notificationController.createParentMeetingReminder);

// Создание напоминания о сроке формирования отчета (требуется роль admin)
router.post('/report-reminder', authMiddleware, roleMiddleware(['admin']), notificationController.createReportReminder);

export default router;