import express from 'express';
import * as feedbackController from '../controllers/feedback.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/routeHelpers';

const router = express.Router();

// Маршруты для получения отзывов
router.get('/', 
  asyncHandler(authMiddleware), 
  asyncHandler(feedbackController.getAllFeedback)
);

router.get('/teacher/:teacherId', 
  asyncHandler(authMiddleware), 
  asyncHandler(feedbackController.getFeedbackByTeacher)
);

router.get('/student/:studentId', 
  asyncHandler(authMiddleware), 
  asyncHandler(feedbackController.getFeedbackByStudent)
);

router.get('/group/:group', 
  asyncHandler(authMiddleware), 
  asyncHandler(feedbackController.getFeedbackByGroup)
);

// Маршруты для управления отзывами
router.post(
  '/',
  asyncHandler(authMiddleware),
  asyncHandler(roleMiddleware(['teacher', 'classTeacher', 'admin'])),
  asyncHandler(feedbackController.createFeedback)
);

router.put(
  '/:id',
  asyncHandler(authMiddleware),
  asyncHandler(roleMiddleware(['teacher', 'classTeacher', 'admin'])),
  asyncHandler(feedbackController.updateFeedback)
);

router.delete(
  '/:id',
  asyncHandler(authMiddleware),
  asyncHandler(roleMiddleware(['teacher', 'classTeacher', 'admin'])),
  asyncHandler(feedbackController.deleteFeedback)
);

export default router; 