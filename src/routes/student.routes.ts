import express from 'express';
import * as studentController from '../controllers/student.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/routeHelpers';

const router = express.Router();

// Маршруты для студентов (с защитой по ролям)
router.get('/', 
  asyncHandler(authMiddleware), 
  asyncHandler(studentController.getAllStudents)
);

router.get('/group/:group', 
  asyncHandler(authMiddleware), 
  asyncHandler(studentController.getStudentsByGroup)
);

router.get('/:id', 
  asyncHandler(authMiddleware), 
  asyncHandler(studentController.getStudentById)
);

// Маршруты только для администраторов и классных руководителей
router.post(
  '/',
  asyncHandler(authMiddleware),
  asyncHandler(roleMiddleware(['admin', 'classTeacher'])),
  asyncHandler(studentController.createStudent)
);

router.put(
  '/:id',
  asyncHandler(authMiddleware),
  asyncHandler(roleMiddleware(['admin', 'classTeacher'])),
  asyncHandler(studentController.updateStudent)
);

router.delete(
  '/:id',
  asyncHandler(authMiddleware),
  asyncHandler(roleMiddleware(['admin'])),
  asyncHandler(studentController.deleteStudent)
);

export default router; 