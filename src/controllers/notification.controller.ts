import { Request, Response } from 'express';
import Notification from '../models/Notification';
import User from '../models/User';
import Feedback from '../models/Feedback';
import Student from '../models/Student';

/**
 * Получение всех уведомлений пользователя
 */
export const getUserNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?._id;
    
    if (!userId) {
      res.status(401).json({ error: 'Пользователь не аутентифицирован' });
      return;
    }
    
    // Получаем все уведомления пользователя
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    
    res.status(200).json(notifications);
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message || 'Ошибка при получении уведомлений' });
  }
};

/**
 * Отметка уведомления как прочитанного
 */
export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?._id;
    const { notificationId } = req.params;
    
    if (!userId) {
      res.status(401).json({ error: 'Пользователь не аутентифицирован' });
      return;
    }
    
    // Находим и обновляем уведомление
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      res.status(404).json({ error: 'Уведомление не найдено' });
      return;
    }
    
    res.status(200).json(notification);
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message || 'Ошибка при обновлении уведомления' });
  }
};

/**
 * Отметка всех уведомлений пользователя как прочитанных
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?._id;
    
    if (!userId) {
      res.status(401).json({ error: 'Пользователь не аутентифицирован' });
      return;
    }
    
    // Обновляем все непрочитанные уведомления пользователя
    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    
    res.status(200).json({ message: 'Все уведомления отмечены как прочитанные' });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: error.message || 'Ошибка при обновлении уведомлений' });
  }
};

/**
 * Создание нового уведомления
 */
export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, title, body, type, data, date } = req.body;
    
    if (!userId || !title || !body) {
      res.status(400).json({ error: 'Не все обязательные поля заполнены' });
      return;
    }
    
    // Проверяем существование пользователя
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }
    
    // Создаем новое уведомление
    const notification = new Notification({
      userId,
      title,
      body,
      type: type || 'SYSTEM',
      data: data || {},
      date: date || null,
      read: false
    });
    
    await notification.save();
    
    // Отмечаем, что уведомление создано в серверном логе
    console.log(`Notification created for user ${userId}`);
    
    res.status(201).json(notification);
  } catch (error: any) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: error.message || 'Ошибка при создании уведомления' });
  }
};

/**
 * Удаление уведомления
 */
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?._id;
    const { notificationId } = req.params;
    
    if (!userId) {
      res.status(401).json({ error: 'Пользователь не аутентифицирован' });
      return;
    }
    
    // Находим и удаляем уведомление
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });
    
    if (!notification) {
      res.status(404).json({ error: 'Уведомление не найдено' });
      return;
    }
    
    res.status(200).json({ message: 'Уведомление успешно удалено' });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message || 'Ошибка при удалении уведомления' });
  }
};

/**
 * Создание напоминания о родительском собрании для классных руководителей
 */
export const createParentMeetingReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId, meetingDate, title, description } = req.body;
    
    if (!groupId || !meetingDate) {
      res.status(400).json({ error: 'Не все обязательные поля заполнены' });
      return;
    }
    
    // Находим классных руководителей для указанной группы
    const classTeachers = await User.find({ role: 'classTeacher', group: groupId });
    
    if (classTeachers.length === 0) {
      res.status(404).json({ error: 'Классные руководители для данной группы не найдены' });
      return;
    }
    
    const reminderTitle = title || 'Напоминание о родительском собрании';
    const reminderBody = description || `Запланировано родительское собрание на ${new Date(meetingDate).toLocaleDateString('ru-RU')}`;
    
    // Создаем уведомления для каждого классного руководителя
    const notificationPromises = classTeachers.map(async (teacher) => {
      // Создаем запись в БД
      const notification = new Notification({
        userId: teacher._id,
        title: reminderTitle,
        body: reminderBody,
        type: 'PARENT_MEETING',
        data: { groupId, meetingDate },
        date: new Date(meetingDate),
        read: false
      });
      
      await notification.save();
      console.log(`Parent meeting reminder created for teacher ${teacher._id}`);
      
      return notification;
    });
    
    const notifications = await Promise.all(notificationPromises);
    
    res.status(201).json({
      message: `Напоминания о собрании успешно созданы для ${notifications.length} классных руководителей`,
      notifications
    });
  } catch (error: any) {
    console.error('Error creating parent meeting reminder:', error);
    res.status(500).json({ error: error.message || 'Ошибка при создании напоминания о собрании' });
  }
};

/**
 * Создание напоминания о сроке формирования отчета
 */
export const createReportReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dueDate, reportType, title, description } = req.body;
    
    if (!dueDate || !reportType) {
      res.status(400).json({ error: 'Не все обязательные поля заполнены' });
      return;
    }
    
    // Находим всех классных руководителей (напоминания о отчетах нужны только им)
    const classTeachers = await User.find({ role: 'classTeacher' });
    
    if (classTeachers.length === 0) {
      res.status(404).json({ error: 'Классные руководители не найдены' });
      return;
    }
    
    const reminderTitle = title || 'Напоминание о формировании отчета';
    const reminderBody = description || `Необходимо сформировать ${reportType} к ${new Date(dueDate).toLocaleDateString('ru-RU')}`;
    
    // Создаем уведомления для каждого классного руководителя
    const notificationPromises = classTeachers.map(async (teacher) => {
      // Создаем запись в БД
      const notification = new Notification({
        userId: teacher._id,
        title: reminderTitle,
        body: reminderBody,
        type: 'REPORT_DUE',
        data: { reportType, dueDate },
        date: new Date(dueDate),
        read: false
      });
      
      await notification.save();
      console.log(`Report reminder created for teacher ${teacher._id}`);
      
      return notification;
    });
    
    const notifications = await Promise.all(notificationPromises);
    
    res.status(201).json({
      message: `Напоминания о сроке отчета успешно созданы для ${notifications.length} классных руководителей`,
      notifications
    });
  } catch (error: any) {
    console.error('Error creating report reminder:', error);
    res.status(500).json({ error: error.message || 'Ошибка при создании напоминания о сроке отчета' });
  }
};

/**
 * Получение количества непрочитанных уведомлений пользователя
 */
export const getUnreadNotificationsCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?._id;
    
    if (!userId) {
      res.status(401).json({ error: 'Пользователь не аутентифицирован' });
      return;
    }
    
    // Получаем количество непрочитанных уведомлений пользователя
    const count = await Notification.countDocuments({ userId, read: false });
    
    res.status(200).json({ count });
  } catch (error: any) {
    console.error('Error fetching unread notifications count:', error);
    res.status(500).json({ error: error.message || 'Ошибка при получении количества непрочитанных уведомлений' });
  }
};

/**
 * Обновление push-токена пользователя
 */
export const updatePushToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?._id;
    const { token } = req.body;
    
    if (!userId) {
      res.status(401).json({ error: 'Пользователь не аутентифицирован' });
      return;
    }
    
    if (!token) {
      res.status(400).json({ error: 'Токен не предоставлен' });
      return;
    }
    
    // Обновляем токен пользователя
    const user = await User.findByIdAndUpdate(
      userId,
      { pushToken: token },
      { new: true }
    );
    
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }
    
    res.status(200).json({ message: 'Push-токен успешно обновлен' });
  } catch (error: any) {
    console.error('Error updating push token:', error);
    res.status(500).json({ error: error.message || 'Ошибка при обновлении push-токена' });
  }
}; 