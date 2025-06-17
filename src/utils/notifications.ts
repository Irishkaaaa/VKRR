import mongoose from 'mongoose';

/**
 * Создание уведомления о новом отзыве
 * @param feedback Объект с данными отзыва
 * @param student Объект с данными студента
 */
export const createFeedbackNotification = async (feedback: any, student: any): Promise<any> => {
  try {
    // Импортируем модели напрямую
    const Notification = (await import('../models/Notification')).default;
    const User = (await import('../models/User')).default;
    
    // Находим классного руководителя для группы студента
    const classTeacher = await User.findOne({
      role: 'classTeacher',
      group: student.group
    });
    
    if (!classTeacher) {
      console.warn(`No class teacher found for group ${student.group}`);
      return null;
    }
    
    // Создаем запись о уведомлении в базе данных
    const notification = new Notification({
      userId: classTeacher._id,
      title: 'Новый отзыв о студенте',
      body: `Студент ${student.name} получил новый отзыв`,
      type: 'NEW_FEEDBACK',
      data: {
        feedbackId: feedback._id.toString(),
        studentId: student._id.toString(),
        studentName: student.name,
      },
      read: false
    });
    
    await notification.save();
    console.log(`Notification created for class teacher ${classTeacher._id}`);

    return notification;
  } catch (error) {
    console.error('Error creating feedback notification:', error);
    return null;
  }
}; 