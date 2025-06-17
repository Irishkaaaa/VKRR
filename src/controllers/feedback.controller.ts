import { Request, Response } from 'express';
import Feedback from '../models/Feedback';
import Student from '../models/Student';
import { createFeedbackNotification } from '../utils/notifications';

// Получение всех отзывов
export const getAllFeedback = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as any; // Получаем информацию о текущем пользователе
    
    console.log(`Запрос на получение всех отзывов от пользователя: ${currentUser._id}, роль: ${currentUser.role}`);
    
    // Строим запрос в зависимости от роли пользователя
    let query = {};
    
    if (currentUser.role === 'admin' || currentUser.role === 'classTeacher') {
      // Администраторы и классные руководители видят все отзывы
      query = {};
    } else {
      // Обычные преподаватели видят только свои отзывы
      query = { teacherId: currentUser._id };
    }
    
    const feedback = await Feedback.find(query)
      .populate('studentId', 'name group')
      .populate('teacherId', 'username')
      .sort({ date: -1 });
    
    // Преобразуем данные для клиента
    const formattedFeedback = feedback.map(item => {
      // Проверяем, что studentId и teacherId - объекты после populate
      const studentObj = typeof item.studentId === 'object' && item.studentId !== null;
      const teacherObj = typeof item.teacherId === 'object' && item.teacherId !== null;
      
      return {
        _id: item._id,
        studentId: studentObj ? (item.studentId as any)._id : item.studentId,
        teacherId: teacherObj ? (item.teacherId as any)._id : item.teacherId,
        subject: item.subject,
        feedbackText: item.feedbackText,
        rating: item.rating,
        date: item.date,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        student: {
          _id: studentObj ? (item.studentId as any)._id : item.studentId,
          name: studentObj ? (item.studentId as any).name : 'Неизвестный студент',
          group: studentObj ? (item.studentId as any).group : 'Не указана'
        },
        teacher: {
          _id: teacherObj ? (item.teacherId as any)._id : item.teacherId,
          username: teacherObj ? (item.teacherId as any).username : 'Неизвестный преподаватель'
        }
      };
    });
    
    console.log(`Возвращаем ${formattedFeedback.length} отзывов`);
    
    return res.status(200).json(formattedFeedback);
  } catch (error) {
    console.error('Error getting all feedback:', error);
    return res.status(500).json({ 
      message: 'Ошибка при получении всех отзывов' 
    });
  }
};

// Получение отзывов по ID учителя
export const getFeedbackByTeacher = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;
    
    console.log(`Запрос отзывов для преподавателя: ${teacherId}`);
    
    const feedback = await Feedback.find({ teacherId })
      .populate('studentId', 'name group')
      .populate('teacherId', 'username')
      .sort({ date: -1 });
    
    // Преобразуем данные для клиента
    const formattedFeedback = feedback.map(item => {
      // Проверяем, что studentId и teacherId - объекты после populate
      const studentObj = typeof item.studentId === 'object' && item.studentId !== null;
      const teacherObj = typeof item.teacherId === 'object' && item.teacherId !== null;
      
      return {
        _id: item._id,
        studentId: studentObj ? (item.studentId as any)._id : item.studentId,
        teacherId: teacherObj ? (item.teacherId as any)._id : item.teacherId,
        subject: item.subject,
        feedbackText: item.feedbackText,
        rating: item.rating,
        date: item.date,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        student: {
          _id: studentObj ? (item.studentId as any)._id : item.studentId,
          name: studentObj ? (item.studentId as any).name : 'Неизвестный студент',
          group: studentObj ? (item.studentId as any).group : 'Не указана'
        },
        teacher: {
          _id: teacherObj ? (item.teacherId as any)._id : item.teacherId,
          username: teacherObj ? (item.teacherId as any).username : 'Неизвестный преподаватель'
        }
      };
    });
    
    console.log(`Возвращаем ${formattedFeedback.length} отзывов для преподавателя ${teacherId}`);
    
    return res.status(200).json(formattedFeedback);
  } catch (error) {
    console.error('Error getting teacher feedback:', error);
    return res.status(500).json({ 
      message: 'Ошибка при получении отзывов преподавателя' 
    });
  }
};

// Получение отзывов по ID студента
export const getFeedbackByStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const currentUser = req.user as any; // Получаем информацию о текущем пользователе
    
    console.log(`Запрос отзывов для студента: ${studentId} от пользователя: ${currentUser._id}, роль: ${currentUser.role}`);
    
    // Строим запрос в зависимости от роли пользователя
    let query = {};
    
    if (currentUser.role === 'admin' || currentUser.role === 'classTeacher') {
      // Администраторы и классные руководители видят все отзывы
      query = { studentId };
    } else {
      // Обычные преподаватели видят только свои отзывы
      query = { 
        studentId,
        teacherId: currentUser._id 
      };
    }
    
    const feedback = await Feedback.find(query)
      .populate('studentId', 'name group')
      .populate('teacherId', 'username')
      .sort({ date: -1 });
    
    // Преобразуем данные для клиента
    const formattedFeedback = feedback.map(item => {
      // Проверяем, что studentId и teacherId - объекты после populate
      const studentObj = typeof item.studentId === 'object' && item.studentId !== null;
      const teacherObj = typeof item.teacherId === 'object' && item.teacherId !== null;
      
      return {
        _id: item._id,
        studentId: studentObj ? (item.studentId as any)._id : item.studentId,
        teacherId: teacherObj ? (item.teacherId as any)._id : item.teacherId,
        subject: item.subject,
        feedbackText: item.feedbackText,
        rating: item.rating,
        date: item.date,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        student: {
          _id: studentObj ? (item.studentId as any)._id : item.studentId,
          name: studentObj ? (item.studentId as any).name : 'Неизвестный студент',
          group: studentObj ? (item.studentId as any).group : 'Не указана'
        },
        teacher: {
          _id: teacherObj ? (item.teacherId as any)._id : item.teacherId,
          username: teacherObj ? (item.teacherId as any).username : 'Неизвестный преподаватель'
        }
      };
    });
    
    console.log(`Возвращаем ${formattedFeedback.length} отзывов для студента ${studentId}`);
    
    return res.status(200).json(formattedFeedback);
  } catch (error) {
    console.error('Error getting student feedback:', error);
    return res.status(500).json({ 
      message: 'Ошибка при получении отзывов студента' 
    });
  }
};

// Получение отзывов по группе
export const getFeedbackByGroup = async (req: Request, res: Response) => {
  try {
    const { group } = req.params;
    const currentUser = req.user as any; // Получаем информацию о текущем пользователе
    
    console.log(`Запрос отзывов для группы: ${group} от пользователя: ${currentUser._id}, роль: ${currentUser.role}`);
    
    // Найдем всех студентов в группе
    const students = await Student.find({ group });
    console.log(`Найдено студентов в группе ${group}: ${students.length}`);
    console.log('ID студентов:', students.map(s => s._id));
    
    const studentIds = students.map(student => student._id);
    
    // Строим запрос в зависимости от роли пользователя
    let query = {}; 
    
    if (currentUser.role === 'admin' || currentUser.role === 'classTeacher') {
      // Администраторы и классные руководители видят все отзывы
      query = { studentId: { $in: studentIds } };
    } else {
      // Обычные преподаватели видят только свои отзывы
      query = { 
        studentId: { $in: studentIds },
        teacherId: currentUser._id 
      };
    }
    
    // Найдем все отзывы для студентов этой группы с учетом прав доступа
    const feedback = await Feedback.find(query)
      .populate('studentId', 'name group')
      .populate('teacherId', 'username')
      .sort({ date: -1 });
    
    console.log(`Найдено отзывов для группы ${group}: ${feedback.length}`);
    
    // Преобразуем данные для клиента
    const formattedFeedback = feedback.map(item => {
      // Проверяем, что studentId и teacherId - объекты после populate
      const studentObj = typeof item.studentId === 'object' && item.studentId !== null;
      const teacherObj = typeof item.teacherId === 'object' && item.teacherId !== null;
      
      return {
        _id: item._id,
        studentId: studentObj ? (item.studentId as any)._id : item.studentId,
        teacherId: teacherObj ? (item.teacherId as any)._id : item.teacherId,
        subject: item.subject,
        feedbackText: item.feedbackText,
        rating: item.rating,
        date: item.date,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        student: {
          _id: studentObj ? (item.studentId as any)._id : item.studentId,
          name: studentObj ? (item.studentId as any).name : 'Неизвестный студент',
          group: studentObj ? (item.studentId as any).group : 'Не указана'
        },
        teacher: {
          _id: teacherObj ? (item.teacherId as any)._id : item.teacherId,
          username: teacherObj ? (item.teacherId as any).username : 'Неизвестный преподаватель'
        }
      };
    });
    
    console.log(`Возвращаем ${formattedFeedback.length} отзывов для группы ${group}`);
    if (formattedFeedback.length > 0) {
      console.log('Пример первого отзыва:', JSON.stringify(formattedFeedback[0], null, 2));
    }
    
    return res.status(200).json(formattedFeedback);
  } catch (error) {
    console.error('Error getting group feedback:', error);
    return res.status(500).json({ 
      message: 'Ошибка при получении отзывов группы' 
    });
  }
};

// Создание нового отзыва
export const createFeedback = async (req: Request, res: Response) => {
  try {
    const { studentId, teacherId: providedTeacherId, subject, feedbackText, rating } = req.body;
    const authTeacherId = (req.user as any)?._id;
    
    // Используем teacherId из запроса, если оно предоставлено, иначе используем id из токена
    const teacherId = providedTeacherId || authTeacherId;

    // Валидация
    if (!studentId || !subject || !feedbackText || !rating) {
      return res.status(400).json({ message: 'Все поля должны быть заполнены' });
    }
    
    if (!teacherId) {
      return res.status(400).json({ message: 'Не указан ID преподавателя' });
    }

    console.log(`Создание отзыва: студент=${studentId}, преподаватель=${teacherId}, оценка=${rating}`);

    // Проверка существования студента
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Студент не найден' });
    }

    // Создание нового отзыва
    const newFeedback = new Feedback({
      studentId,
      teacherId,
      subject,
      feedbackText,
      rating,
      date: new Date()
    });

    const savedFeedback = await newFeedback.save();

    // Отправляем уведомление классному руководителю о новом отзыве
    try {
      await createFeedbackNotification(savedFeedback, student);
    } catch (notificationError) {
      console.error('Ошибка при отправке уведомления:', notificationError);
      // Не прерываем выполнение, если не удалось отправить уведомление
    }

    // Загружаем данные о студенте и преподавателе
    const populatedFeedback = await Feedback.findById(savedFeedback._id)
      .populate('studentId', 'name group')
      .populate('teacherId', 'username');

    // Преобразуем данные для клиента
    const studentObj = typeof populatedFeedback?.studentId === 'object' && populatedFeedback?.studentId !== null;
    const teacherObj = typeof populatedFeedback?.teacherId === 'object' && populatedFeedback?.teacherId !== null;

    // Проверяем, успешно ли загружен отзыв
    if (!populatedFeedback) {
      console.error('Ошибка: отзыв сохранен, но не найден при попытке загрузки');
      // Вернем успешный ответ, но без данных
      return res.status(201).json({
        _id: savedFeedback._id,
        studentId,
        teacherId,
        subject,
        feedbackText,
        rating,
        date: new Date(),
        createdAt: savedFeedback.createdAt,
        updatedAt: savedFeedback.updatedAt,
        message: 'Отзыв создан, но данные не загружены полностью'
      });
    }

    const formattedFeedback = {
      _id: populatedFeedback._id,
      studentId: studentObj ? (populatedFeedback.studentId as any)._id : populatedFeedback.studentId,
      teacherId: teacherObj ? (populatedFeedback.teacherId as any)._id : populatedFeedback.teacherId,
      subject: populatedFeedback.subject,
      feedbackText: populatedFeedback.feedbackText,
      rating: populatedFeedback.rating,
      date: populatedFeedback.date,
      createdAt: populatedFeedback.createdAt,
      updatedAt: populatedFeedback.updatedAt,
      student: {
        _id: studentObj ? (populatedFeedback.studentId as any)._id : populatedFeedback.studentId,
        name: studentObj ? (populatedFeedback.studentId as any).name : 'Неизвестный студент',
        group: studentObj ? (populatedFeedback.studentId as any).group : 'Не указана'
      },
      teacher: {
        _id: teacherObj ? (populatedFeedback.teacherId as any)._id : populatedFeedback.teacherId,
        username: teacherObj ? (populatedFeedback.teacherId as any).username : 'Неизвестный преподаватель'
      }
    };
    
    console.log('Отзыв успешно создан:', JSON.stringify(formattedFeedback, null, 2));

    return res.status(201).json({
      feedback: formattedFeedback,
      message: 'Отзыв успешно создан'
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return res.status(500).json({ 
      message: 'Ошибка при создании отзыва' 
    });
  }
};

// Обновление отзыва
export const updateFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subject, feedbackText, rating, date } = req.body;
    
    // Валидация полей
    if (!subject && !feedbackText && !rating && !date) {
      return res.status(400).json({ 
        message: 'Необходимо предоставить данные для обновления' 
      });
    }
    
    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { subject, feedbackText, rating, date },
      { new: true, runValidators: true }
    )
      .populate('studentId', 'name group')
      .populate('teacherId', 'username');
    
    if (!feedback) {
      return res.status(404).json({ 
        message: 'Отзыв не найден' 
      });
    }
    
    return res.status(200).json({
      message: 'Отзыв успешно обновлен',
      feedback
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return res.status(500).json({ 
      message: 'Ошибка при обновлении отзыва' 
    });
  }
};

// Удаление отзыва
export const deleteFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findByIdAndDelete(id);
    
    if (!feedback) {
      return res.status(404).json({ 
        message: 'Отзыв не найден' 
      });
    }
    
    return res.status(200).json({
      message: 'Отзыв успешно удален'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return res.status(500).json({ 
      message: 'Ошибка при удалении отзыва' 
    });
  }
}; 