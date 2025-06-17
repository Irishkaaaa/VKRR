import api from './api';

// Тип данных отзыва
export interface Feedback {
  _id: string;
  studentId: string;
  teacherId: string;
  subject: string;
  feedbackText: string;
  rating: number;
  date: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    _id: string;
    name: string;
    group: string;
  };
  teacher?: {
    _id: string;
    username: string;
  };
}

// Тип данных для создания отзыва
export interface CreateFeedbackData {
  studentId: string;
  teacherId: string;
  subject: string;
  feedbackText: string;
  rating: number;
  date?: string;
}

/**
 * Получить все отзывы
 */
export const getAllFeedback = async (): Promise<Feedback[]> => {
  try {
    console.log('Отправка запроса для получения всех отзывов');
    const response = await api.get<Feedback[]>('/feedback');
    console.log('Ответ сервера (getAllFeedback):', response.data.length);
    return response.data;
  } catch (error: any) {
    console.error('Get all feedback error details:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error full:', JSON.stringify(error, null, 2));
    throw error.response?.data?.message || 'Ошибка при получении списка отзывов';
  }
};

/**
 * Получить отзывы по ID преподавателя
 */
export const getFeedbackByTeacher = async (teacherId: string): Promise<Feedback[]> => {
  try {
    const response = await api.get<Feedback[]>(`/feedback/teacher/${teacherId}`);
    return response.data;
  } catch (error: any) {
    console.error('Get feedback by teacher error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Ошибка при получении отзывов преподавателя';
  }
};

/**
 * Получить отзывы по ID студента
 */
export const getFeedbackByStudent = async (studentId: string): Promise<Feedback[]> => {
  try {
    const response = await api.get<Feedback[]>(`/feedback/student/${studentId}`);
    return response.data;
  } catch (error: any) {
    console.error('Get feedback by student error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Ошибка при получении отзывов студента';
  }
};

/**
 * Получить отзывы по группе
 */
export const getFeedbackByGroup = async (group: string): Promise<Feedback[]> => {
  try {
    console.log(`Отправка запроса на получение отзывов для группы ${group}`);
    const response = await api.get<Feedback[]>(`/feedback/group/${group}`);
    console.log('Ответ сервера:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('Get feedback by group error details:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error full:', JSON.stringify(error, null, 2));
    throw error.response?.data?.message || 'Ошибка при получении отзывов группы';
  }
};

/**
 * Создать новый отзыв
 */
export const createFeedback = async (feedbackData: CreateFeedbackData): Promise<Feedback> => {
  try {
    console.log('Отправка данных отзыва на сервер:', JSON.stringify(feedbackData, null, 2));
    console.log('URL запроса:', '/feedback');
    
    const response = await api.post<{ feedback: Feedback; message: string }>('/feedback', feedbackData);
    console.log('Ответ сервера:', JSON.stringify(response.data, null, 2));
    
    // Проверяем формат ответа
    if (response.data?.feedback) {
      // Новый формат ответа
      return response.data.feedback;
    } else if (response.data && typeof response.data === 'object' && '_id' in response.data) {
      // Старый формат ответа или прямой объект
      return response.data as unknown as Feedback;
    } else {
      console.error('Неизвестный формат ответа:', response.data);
      throw new Error('Неожиданный формат ответа от сервера');
    }
  } catch (error: any) {
    console.error('Create feedback error details:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error full:', JSON.stringify(error, null, 2));
    throw error.response?.data?.message || 'Ошибка при создании отзыва';
  }
};

/**
 * Обновить отзыв
 */
export const updateFeedback = async (feedbackId: string, feedbackData: Partial<CreateFeedbackData>): Promise<Feedback> => {
  try {
    const response = await api.put<{ feedback: Feedback; message: string }>(`/feedback/${feedbackId}`, feedbackData);
    return response.data.feedback;
  } catch (error: any) {
    console.error('Update feedback error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Ошибка при обновлении отзыва';
  }
};

/**
 * Удалить отзыв
 */
export const deleteFeedback = async (feedbackId: string): Promise<void> => {
  try {
    await api.delete(`/feedback/${feedbackId}`);
  } catch (error: any) {
    console.error('Delete feedback error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Ошибка при удалении отзыва';
  }
}; 