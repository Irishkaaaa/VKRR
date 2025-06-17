import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Константы для ключей хранилища
const STORAGE_KEYS = {
  TOKEN: 'authToken',
  USER: 'authUser'
};

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'teacher' | 'classTeacher' | 'admin';
  group?: string;
  subjects?: string[];
}

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'teacher' | 'classTeacher' | 'admin';
  group?: string;
  subjects?: string[];
}

interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

// Проверка и обновление заголовков API
const updateApiHeaders = async () => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const login = async (loginData: LoginData): Promise<User> => {
  try {
    const { data } = await api.post<AuthResponse>('/auth/login', loginData);
    
    if (!data?.token || !data?.user) {
      throw new Error('Неверный ответ сервера: отсутствует токен или данные пользователя');
    }

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, data.token),
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user))
    ]);

    // Обновляем заголовки API после входа
    await updateApiHeaders();

    return data.user;
  } catch (error: any) {
    console.error('Login error:', error);
    const errorMessage = error.response?.data?.message 
      || error.message 
      || 'Ошибка при входе';
    throw new Error(errorMessage);
  }
};

export const register = async (registerData: RegisterData): Promise<User> => {
  try {
    const { data } = await api.post<AuthResponse>('/auth/register', registerData);

    if (!data?.token || !data?.user) {
      throw new Error('Неверный ответ сервера: отсутствует токен или данные пользователя');
    }

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, data.token),
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user))
    ]);

    // Обновляем заголовки API после регистрации
    await updateApiHeaders();

    return data.user;
  } catch (error: any) {
    console.error('Register error:', error);
    const errorMessage = error.response?.data?.message 
      || error.message 
      || 'Ошибка при регистрации';
    throw new Error(errorMessage);
  }
};

export const logout = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER)
    ]);

    // Очищаем заголовки API после выхода
    await updateApiHeaders();
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Ошибка при выходе');
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Get token error:', error);
    return null;
  }
};

// Инициализация заголовков при запуске приложения
export const initializeAuth = async () => {
  await updateApiHeaders();
};