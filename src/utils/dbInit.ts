import mongoose from 'mongoose';
import User from '../models/User';
import Student from '../models/Student';
import Feedback from '../models/Feedback';

/**
 * Функция проверяет наличие в базе данных и заполняет начальными данными
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('Проверка наличия данных в базе данных...');
    
    // Проверка коллекции пользователей
    const usersCount = await User.countDocuments();
    if (usersCount === 0) {
      console.log('Создание начальных пользователей...');
      
      // Создаем админа
      const admin = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
      });
      
      // Создаем преподавателя
      const teacher = new User({
        username: 'teacher',
        email: 'teacher@example.com',
        password: 'teacher123',
        role: 'teacher',
      });
      
      // Создаем классного руководителя
      const classTeacher = new User({
        username: 'classTeacher',
        email: 'classteacher@example.com',
        password: 'class123',
        role: 'classTeacher',
        group: 'Группа A',
      });
      
      await Promise.all([
        admin.save(),
        teacher.save(),
        classTeacher.save(),
      ]);
      
      console.log('Начальные пользователи созданы');
    }
    
    // Проверка коллекции студентов
    const studentsCount = await Student.countDocuments();
    if (studentsCount === 0) {
      console.log('Создание начальных студентов...');
      
      const students = [
        { name: 'Иванов Иван', group: 'Группа A' },
        { name: 'Петров Петр', group: 'Группа A' },
        { name: 'Сидорова Мария', group: 'Группа A' },
        { name: 'Козлов Алексей', group: 'Группа Б' },
        { name: 'Смирнова Елена', group: 'Группа Б' },
      ];
      
      await Student.insertMany(students);
      console.log('Начальные студенты созданы');
      
      // Добавление отзывов для созданных студентов
      if (await Feedback.countDocuments() === 0) {
        console.log('Создание начальных отзывов...');
        
        // Получаем созданных пользователей и студентов
        const teacherUser = await User.findOne({ username: 'teacher' });
        const createdStudents = await Student.find();
        
        if (teacherUser && createdStudents.length > 0) {
          const feedbacks = [
            {
              studentId: createdStudents[0]._id,
              teacherId: teacherUser._id,
              subject: 'Математика',
              feedbackText: 'Отлично справляется с заданиями',
              rating: 5,
              date: new Date()
            },
            {
              studentId: createdStudents[1]._id,
              teacherId: teacherUser._id,
              subject: 'Информатика',
              feedbackText: 'Нуждается в дополнительной работе',
              rating: 3,
              date: new Date()
            },
            {
              studentId: createdStudents[2]._id,
              teacherId: teacherUser._id,
              subject: 'Физика',
              feedbackText: 'Активно участвует в обсуждениях',
              rating: 4,
              date: new Date()
            }
          ];
          
          await Feedback.insertMany(feedbacks);
          console.log('Начальные отзывы созданы');
        }
      }
    }
    
    console.log('Инициализация базы данных завершена.');
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    throw error;
  }
}; 