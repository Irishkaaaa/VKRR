import api from './api';

// Тип данных студента
export interface Student {
  _id: string;
  name: string;
  group: string;
  createdAt: string;
  updatedAt: string;
}

// Тип данных для создания студента
export interface CreateStudentData {
  name: string;
  group: string;
}

/**
 * Получить всех студентов
 */
export const getAllStudents = async (): Promise<Student[]> => {
  try {
    const response = await api.get<Student[]>('/students');
    return response.data;
  } catch (error: any) {
    console.error('Get all students error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Ошибка при получении списка студентов';
  }
};

/**
 * Получить студентов по группе
 */
export const getStudentsByGroup = async (groupId: string): Promise<Student[]> => {
  try {
    const response = await api.get<Student[]>(`/students/group/${groupId}`);
    return response.data;
  } catch (error: any) {
    console.error('Get students by group error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Ошибка при получении студентов группы';
  }
};

/**
 * Получить студента по ID
 */
export const getStudentById = async (studentId: string): Promise<Student> => {
  try {
    const response = await api.get<Student>(`/students/${studentId}`);
    return response.data;
  } catch (error: any) {
    console.error('Get student by id error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Ошибка при получении данных студента';
  }
};

/**
 * Создать нового студента
 */
export const createStudent = async (studentData: CreateStudentData): Promise<Student> => {
  try {
    const response = await api.post<{ student: Student; message: string }>('/students', studentData);
    return response.data.student;
  } catch (error: any) {
    console.error('Create student error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Ошибка при создании студента';
  }
};

/**
 * Обновить данные студента
 */
export const updateStudent = async (studentId: string, studentData: Partial<CreateStudentData>): Promise<Student> => {
  try {
    const response = await api.put<{ student: Student; message: string }>(`/students/${studentId}`, studentData);
    return response.data.student;
  } catch (error: any) {
    console.error('Update student error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Ошибка при обновлении данных студента';
  }
};

/**
 * Удалить студента
 */
export const deleteStudent = async (studentId: string): Promise<void> => {
  try {
    await api.delete(`/students/${studentId}`);
  } catch (error: any) {
    console.error('Delete student error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Ошибка при удалении студента';
  }
}; 