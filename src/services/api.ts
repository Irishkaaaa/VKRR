import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Конфигурация базового URL
const getBaseUrl = () => {
  if (__DEV__) {
    // Для Expo Go используем локальный IP вашего компьютера
    return 'http://192.168.0.14:5000/api';
  }
  return 'https://your-production-api.com/api';
};

// Создание инстанса axios с улучшенной конфигурацией
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000, // Увеличил таймаут до 15 секунд
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Константы для ключей хранилища
const STORAGE_KEYS = {
  TOKEN: 'authToken',
  USER: 'authUser'
};

// Улучшенный интерцептор запросов
api.interceptors.request.use(
  async (config) => {
    try {
      // Не добавляем токен для эндпоинтов авторизации
      if (!config.url?.includes('/auth/')) {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      if (__DEV__) {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
          data: config.data,
          headers: config.headers
        });
      }
      
      return config;
    } catch (error) {
      console.error('[API] Ошибка при обработке запроса:', error);
      throw error;
    }
  },
  (error) => {
    console.error('[API] Ошибка конфигурации запроса:', error);
    return Promise.reject(error);
  }
);

// Улучшенный интерцептор ответов
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API] Ответ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    if (!error.config) {
      console.error('[API] Критическая ошибка: конфигурация запроса отсутствует');
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    
    if (__DEV__) {
      console.error(`[API] Ошибка ${error.response?.status || 'нет статуса'} ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`, {
        error: error.message,
        response: error.response?.data,
        config: error.config
      });
    }

    // Обработка сетевых ошибок
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.error('[API] Проблема с сетью. Проверьте подключение к интернету и доступность сервера');
      // Можно добавить обработчик для показа уведомления пользователю
    }

    // Обработка ошибки авторизации (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
        // Здесь можно добавить логику обновления токена
      } catch (storageError) {
        console.error('[API] Ошибка при очистке хранилища:', storageError);
      }
    }

    return Promise.reject(error);
  }
);

// Вспомогательная функция для проверки доступности сервера
export const checkServerAvailability = async () => {
  try {
    const response = await axios.get(getBaseUrl().replace('/api', ''), {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    console.error('Сервер недоступен:', error);
    return false;
  }
};

export default api;