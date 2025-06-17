import React, { createContext, useState, useContext, useEffect } from 'react';
import * as feedbackService from '../services/feedbackService';
import * as studentService from '../services/studentService';
import { Feedback, CreateFeedbackData } from '../services/feedbackService';
import { Student } from '../services/studentService';
import { useAuth } from './AuthContext';
import * as notificationService from '../services/notificationService';

// Define the feedback item type
export interface FeedbackItem {
  _id: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  content: string;
  type: 'positive' | 'negative' | 'neutral';
  date: string;
}

// Define the feedback context type
interface FeedbackContextType {
  feedbacks: Feedback[];
  students: Student[];
  isLoading: boolean;
  error: string | null;
  loadFeedbacks: () => Promise<void>;
  loadStudents: () => Promise<void>;
  addFeedback: (feedbackData: CreateFeedbackData) => Promise<boolean>;
  updateFeedback: (id: string, feedbackData: Partial<CreateFeedbackData>) => Promise<boolean>;
  deleteFeedback: (id: string) => Promise<boolean>;
  getFeedbackByTeacher: (teacherId: string) => Promise<Feedback[]>;
  getFeedbackByStudent: (studentId: string) => Promise<Feedback[]>;
  getFeedbackByGroup: (group: string) => Promise<Feedback[]>;
  clearError: () => void;
}

// Example student data for UI
export const STUDENTS = [
  { id: 's1', name: 'Иванов Петр', groupId: 'group1', groupName: 'Группа А' },
  { id: 's2', name: 'Смирнова Мария', groupId: 'group1', groupName: 'Группа А' },
  { id: 's3', name: 'Кузнецов Алексей', groupId: 'group1', groupName: 'Группа А' },
  { id: 's4', name: 'Попова Елена', groupId: 'group2', groupName: 'Группа Б' },
  { id: 's5', name: 'Соколов Дмитрий', groupId: 'group2', groupName: 'Группа Б' },
];

// Sample feedback phrases
export const FEEDBACK_PHRASES = {
  positive: [
    'Активно участвовал в занятии',
    'Выполнил все задания вовремя',
    'Показал отличное понимание материала',
    'Помогал другим студентам',
    'Задавал содержательные вопросы'
  ],
  negative: [
    'Использовал телефон во время занятия',
    'Не выполнил домашнее задание',
    'Не отвечал на вопросы',
    'Мешал другим студентам',
    'Опоздал на занятие'
  ],
  neutral: [
    'Присутствовал на занятии',
    'Требует дополнительной помощи по теме',
    'Минимально участвовал',
    'Нуждается в большей практике'
  ]
};

// Create the context with a default value
const FeedbackContext = createContext<FeedbackContextType>({
  feedbacks: [],
  students: [],
  isLoading: false,
  error: null,
  loadFeedbacks: async () => {},
  loadStudents: async () => {},
  addFeedback: async () => false,
  updateFeedback: async () => false,
  deleteFeedback: async () => false,
  getFeedbackByTeacher: async () => [],
  getFeedbackByStudent: async () => [],
  getFeedbackByGroup: async () => [],
  clearError: () => {},
});

// Create a provider component
export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Очистка ошибки
  const clearError = () => {
    setError(null);
  };

  // Загрузка всех отзывов
 const loadFeedbacks = async () => {
    try {
      setIsLoading(true);
      clearError();
      
      let data: Feedback[] = [];
      
      // Логируем информацию о пользователе для отладки
      console.log('Текущий пользователь:', JSON.stringify(user, null, 2));
      
      // Загрузка отзывов в зависимости от роли пользователя
      if (user) {
        console.log('Загрузка отзывов без фильтрации по роли');
        try {
          // Загружаем все отзывы независимо от роли для отладки
          data = await feedbackService.getAllFeedback();
          console.log('Получены все отзывы:', data.length);
          
          // Проверяем каждый отзыв на наличие необходимых полей
          data = data.filter(item => {
            if (!item) {
              console.warn('Обнаружен пустой отзыв в ответе сервера');
              return false;
            }
            
            // Проверка наличия обязательных полей
            if (!item.subject) {
              console.warn(`Отзыв ${item._id} не имеет поля subject, добавляем значение по умолчанию`);
              item.subject = 'Не указан';
            }
            
            if (!item.rating) {
              console.warn(`Отзыв ${item._id} не имеет поля rating, добавляем значение по умолчанию`);
              item.rating = 3; // Нейтральный рейтинг по умолчанию
            }
            
            if (!item.feedbackText) {
              console.warn(`Отзыв ${item._id} не имеет поля feedbackText, добавляем значение по умолчанию`);
              item.feedbackText = 'Текст отзыва отсутствует';
            }
            
            return true;
          });
          
          // Проверим наличие отзывов для группы классного руководителя
          if (user.role === 'classTeacher' && user.group) {
            console.log(`Проверка отзывов для группы ${user.group}`);
            const groupFeedbacks = data.filter(
              item => item.student && item.student.group && 
              item.student.group.trim().toLowerCase() === user.group!.trim().toLowerCase()
            );
            console.log(`Найдено отзывов для группы ${user.group}: ${groupFeedbacks.length}`);
          }
        } catch (error) {
          console.error('Ошибка при получении отзывов:', error);
        }
      }
      
      console.log('Получено отзывов всего:', data.length);
      setFeedbacks(data);
    } catch (err: any) {
      console.error('Load feedbacks error:', err);
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка всех студентов
  const loadStudents = async () => {
    try {
      setIsLoading(true);
      clearError();
      
      let data: Student[] = [];
      
      // Загрузка студентов в зависимости от роли пользователя
      if (user) {
        if (user.role === 'admin') {
          // Администраторы видят всех студентов
          data = await studentService.getAllStudents();
        } else if (user.role === 'classTeacher' && user.group) {
          // Классные руководители видят студентов своей группы
          data = await studentService.getStudentsByGroup(user.group);
        } else if (user.role === 'teacher') {
          // Преподаватели видят всех студентов
          data = await studentService.getAllStudents();
        }
      }
      
      setStudents(data);
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  // Автоматическая загрузка данных при монтировании компонента или изменении пользователя
  useEffect(() => {
    if (user) {
      loadFeedbacks();
      loadStudents();
    }
  }, [user]);

  // Добавление нового отзыва
  const addFeedback = async (feedbackData: CreateFeedbackData): Promise<boolean> => {
    try {
      setIsLoading(true);
      clearError();
      console.log('Создаем новый отзыв с данными:', JSON.stringify(feedbackData, null, 2));
      const newFeedback = await feedbackService.createFeedback(feedbackData);
      console.log('Получен ответ от сервера:', JSON.stringify(newFeedback, null, 2));
      
      // Проверяем, что newFeedback существует
      if (!newFeedback) {
        console.error('Ошибка: не получен ответ от сервера при создании отзыва');
        return false;
      }
      
      // Загружаем студента, если его нет в ответе сервера
      let studentName = 'Студент';
      
      // Сначала проверяем, есть ли вложенный объект student и его name
      if (newFeedback.student && newFeedback.student.name) {
        studentName = newFeedback.student.name;
        console.log('Имя студента из ответа сервера:', studentName);
      } 
      // Если нет, ищем студента среди загруженных
      else if (feedbackData.studentId) {
        try {
          const student = students.find(s => s._id === feedbackData.studentId);
          if (student) {
            studentName = student.name;
            console.log('Найден студент в локальном кэше:', student.name);
          } else {
            console.log('Студент не найден в локальном кэше, используем ID:', feedbackData.studentId);
          }
        } catch (studentError) {
          console.error('Ошибка при поиске студента:', studentError);
        }
      }
      
      // Добавляем отзыв в список
      setFeedbacks(prev => [...prev, newFeedback]);
      
      // Инициализируем уведомления перед отправкой
      const notificationsInitialized = await notificationService.initializeLocalNotifications();
      console.log('Статус инициализации уведомлений:', notificationsInitialized);
      
      // Проверяем, включены ли уведомления
      const notificationsEnabled = await notificationService.getNotificationSettings();
      console.log('Уведомления включены:', notificationsEnabled);
      
      if (notificationsEnabled) {
        // Отправляем локальное уведомление о новом отзыве
        try {
          const notificationId = await notificationService.sendLocalNotification(
            'Новый отзыв добавлен',
            `Отзыв о студенте ${studentName} успешно создан`,
            { 
              type: 'NEW_FEEDBACK',
              feedbackId: newFeedback._id,
              studentId: feedbackData.studentId,
              studentName: studentName
            }
          );
          console.log('Уведомление отправлено с ID:', notificationId);
        } catch (notificationError) {
          console.error('Ошибка при отправке уведомления:', notificationError);
        }
      }
      
      return true;
    } catch (err: any) {
      console.error('Ошибка при добавлении отзыва:', err);
      setError(err.toString());
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление отзыва
  const updateFeedback = async (id: string, feedbackData: Partial<CreateFeedbackData>): Promise<boolean> => {
    try {
      setIsLoading(true);
      clearError();
      const updatedFeedback = await feedbackService.updateFeedback(id, feedbackData);
      setFeedbacks(prev => prev.map(f => f._id === id ? updatedFeedback : f));
      return true;
    } catch (err: any) {
      setError(err.toString());
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Удаление отзыва
  const deleteFeedback = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      clearError();
      await feedbackService.deleteFeedback(id);
      setFeedbacks(prev => prev.filter(f => f._id !== id));
      return true;
    } catch (err: any) {
      setError(err.toString());
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Получение отзывов по преподавателю
  const getFeedbackByTeacher = async (teacherId: string): Promise<Feedback[]> => {
    try {
      setIsLoading(true);
      clearError();
      const data = await feedbackService.getFeedbackByTeacher(teacherId);
      return data;
    } catch (err: any) {
      setError(err.toString());
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Получение отзывов по студенту
  const getFeedbackByStudent = async (studentId: string): Promise<Feedback[]> => {
    try {
      setIsLoading(true);
      clearError();
      const data = await feedbackService.getFeedbackByStudent(studentId);
      return data;
    } catch (err: any) {
      setError(err.toString());
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Получение отзывов по группе
  const getFeedbackByGroup = async (group: string): Promise<Feedback[]> => {
    try {
      setIsLoading(true);
      clearError();
      const data = await feedbackService.getFeedbackByGroup(group);
      return data;
    } catch (err: any) {
      setError(err.toString());
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FeedbackContext.Provider
      value={{
        feedbacks,
        students,
        isLoading,
        error,
        loadFeedbacks,
        loadStudents,
        addFeedback,
        updateFeedback,
        deleteFeedback,
        getFeedbackByTeacher,
        getFeedbackByStudent,
        getFeedbackByGroup,
        clearError,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};

// Custom hook for using the feedback context
export const useFeedback = () => useContext(FeedbackContext); 