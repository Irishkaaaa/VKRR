import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { config } from '../config';

// Типы уведомлений в системе
export type NotificationType = 
  | 'NEW_FEEDBACK' // Новый отзыв для класса руководителя
  | 'PARENT_MEETING' // Напоминание о родительском собрании
  | 'REPORT_DUE' // Напоминание о сроке сдачи отчета
  | 'SYSTEM' // Системное уведомление
  | 'OTHER'; // Другое

// Интерфейс для уведомления
export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: any;
  read: boolean;
  createdAt: Date | string;
  date?: Date | string; // Дата, к которой относится уведомление
}

/// Настройка обработчика уведомлений (корректная версия)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,  // Добавлено для iOS
    shouldShowList: true     // Добавлено для Android
  }),
});

// Проверка настроек уведомлений
export async function getNotificationSettings(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem('notificationsEnabled');
    return enabled === 'true' || enabled === null; // По умолчанию включено
  } catch (error) {
    console.error('Failed to get notification settings:', error);
    return true; // По умолчанию включено
  }
}

// Инициализация локальных уведомлений
export async function initializeLocalNotifications() {
  try {
    console.log('Начинаем инициализацию уведомлений...');
    
    // Проверяем, включены ли уведомления
    const notificationsEnabled = await getNotificationSettings();
    console.log(`Настройки уведомлений: ${notificationsEnabled ? 'включены' : 'выключены'}`);
    if (!notificationsEnabled) {
      console.log('Уведомления выключены в настройках. Прекращаем инициализацию.');
      return false;
    }
    
    // Проверяем, что устройство реальное, а не эмулятор
    if (!Device.isDevice) {
      console.log('Устройство не реальное. Это может быть эмулятор.');
      console.log('На эмуляторах уведомления могут работать некорректно.');
    }
    
    // Запрашиваем разрешения на уведомления
    console.log('Проверяем текущие разрешения...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log(`Текущий статус разрешений: ${existingStatus}`);
    
    let finalStatus = existingStatus;
    
    // Если у нас еще нет разрешений, запрашиваем их
    if (existingStatus !== 'granted') {
      console.log('Разрешения не предоставлены, запрашиваем...');
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log(`Новый статус разрешений: ${finalStatus}`);
      } catch (permissionError) {
        console.error('Ошибка при запросе разрешений:', permissionError);
      }
    }
    
    // Если разрешения не получены, возвращаем false
    if (finalStatus !== 'granted') {
      console.log('Не удалось получить разрешения для уведомлений!');
      return false;
    }
    
    // Дополнительные настройки для Android
    if (Platform.OS === 'android') {
      console.log('Настраиваем канал уведомлений для Android...');
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
        console.log('Канал уведомлений настроен успешно');
      } catch (channelError) {
        console.error('Ошибка при настройке канала уведомлений:', channelError);
      }
    }
    
    console.log('Инициализация уведомлений завершена успешно!');
    return true;
  } catch (error) {
    console.error('Критическая ошибка при инициализации уведомлений:', error);
    return false;
  }
}

// Сохранение настроек уведомлений
export async function saveNotificationSettings(enabled: boolean) {
  try {
    await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(enabled));
    return true;
  } catch (error) {
    console.error('Failed to save notification settings:', error);
    return false;
  }
}

// Отправка локального уведомления
export async function sendLocalNotification(
  title: string,
  body: string,
  data: any = {}
) {
  try {
    // Проверяем входные данные
    console.log(`Отправка уведомления с title=${title}, body=${body}`);
    console.log('Дополнительные данные:', JSON.stringify(data, null, 2));
    
    if (!title || !body) {
      console.error('Ошибка отправки уведомления: отсутствует заголовок или текст');
      return null;
    }

    // Проверяем, включены ли уведомления
    const enabled = await getNotificationSettings();
    console.log(`Отправка уведомления - настройки: ${enabled ? 'включены' : 'выключены'}`);
    if (!enabled) {
      console.log('Уведомления отключены в настройках. Уведомление не отправлено.');
      return null;
    }
    
    // Проверяем, инициализированы ли разрешения
    const { status } = await Notifications.getPermissionsAsync();
    console.log(`Статус разрешений: ${status}`);
    if (status !== 'granted') {
      console.log('Нет разрешения на отправку уведомлений. Пробуем запросить разрешение.');
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.log('Пользователь отклонил запрос на разрешение уведомлений.');
        return null;
      }
    }
    
    console.log(`Отправка уведомления: "${title}" - "${body}"`);
    console.log('Дополнительные данные:', JSON.stringify(data));
    
    // Отправляем уведомление немедленно
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true, // Добавляем звук
        priority: Notifications.AndroidNotificationPriority.HIGH, // Высокий приоритет
      },
      trigger: null, // немедленно
    });
    
    console.log(`Уведомление успешно отправлено с ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Ошибка при отправке уведомления:', error);
    console.error('Детали ошибки:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('Стек вызовов:', (error as Error).stack);
    return null;
  }
}

// Запланировать напоминание о родительском собрании
export async function scheduleParentMeetingReminder(
  meetingDate: Date,
  groupName: string
) {
  // Добавим это в локальное хранилище для использования в приложении
  try {
    // Получаем существующие напоминания
    const remindersJson = await AsyncStorage.getItem('meetingReminders') || '[]';
    const reminders = JSON.parse(remindersJson);
    
    // Добавляем новое напоминание
    const newReminder = {
      id: Date.now().toString(),
      date: meetingDate,
      groupName,
      type: 'PARENT_MEETING',
      title: 'Родительское собрание',
      body: `Родительское собрание для группы ${groupName}`,
      createdAt: new Date(),
      read: false
    };
    
    reminders.push(newReminder);
    
    // Сохраняем обновленный список напоминаний
    await AsyncStorage.setItem('meetingReminders', JSON.stringify(reminders));
    
    // Планируем локальное уведомление за 1 день до собрания
    const oneDayBefore = new Date(meetingDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    
    if (oneDayBefore > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Напоминание о родительском собрании',
          body: `Завтра состоится родительское собрание для группы ${groupName}`,
          data: { type: 'PARENT_MEETING', groupName, date: meetingDate },
        },
        trigger: { 
          seconds: Math.floor((oneDayBefore.getTime() - new Date().getTime()) / 1000),
          channelId: 'default' 
        },
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error scheduling parent meeting reminder:', error);
    return false;
  }
}

// Запланировать напоминание о сроке формирования отчета
export async function scheduleReportReminder(
  dueDate: Date,
  reportType: string
) {
  try {
    // Получаем существующие напоминания
    const remindersJson = await AsyncStorage.getItem('reportReminders') || '[]';
    const reminders = JSON.parse(remindersJson);
    
    // Добавляем новое напоминание
    const newReminder = {
      id: Date.now().toString(),
      date: dueDate,
      reportType,
      type: 'REPORT_DUE',
      title: 'Срок формирования отчета',
      body: `Необходимо сформировать ${reportType} к ${new Date(dueDate).toLocaleDateString('ru-RU')}`,
      createdAt: new Date(),
      read: false
    };
    
    reminders.push(newReminder);
    
    // Сохраняем обновленный список напоминаний
    await AsyncStorage.setItem('reportReminders', JSON.stringify(reminders));
    
    // Планируем локальное уведомление за 3 дня до срока
    const threeDaysBefore = new Date(dueDate);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
    
    if (threeDaysBefore > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Напоминание о формировании отчета',
          body: `Через 3 дня истекает срок формирования ${reportType}`,
          data: { type: 'REPORT_DUE', reportType, date: dueDate },
        },
        trigger: { 
          seconds: Math.floor((threeDaysBefore.getTime() - new Date().getTime()) / 1000),
          channelId: 'default' 
        },
      });
    }
    
    // Планируем локальное уведомление за 1 день до срока
    const oneDayBefore = new Date(dueDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    
    if (oneDayBefore > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Напоминание о формировании отчета',
          body: `Завтра истекает срок формирования ${reportType}`,
          data: { type: 'REPORT_DUE', reportType, date: dueDate },
        },
        trigger: { 
          seconds: Math.floor((oneDayBefore.getTime() - new Date().getTime()) / 1000),
          channelId: 'default' 
        },
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error scheduling report reminder:', error);
    return false;
  }
}

// Получение сохраненных напоминаний о родительских собраниях
export async function getMeetingReminders(): Promise<Notification[]> {
  try {
    const remindersJson = await AsyncStorage.getItem('meetingReminders') || '[]';
    return JSON.parse(remindersJson);
  } catch (error) {
    console.error('Error getting meeting reminders:', error);
    return [];
  }
}

// Получение сохраненных напоминаний о сроках отчетов
export async function getReportReminders(): Promise<Notification[]> {
  try {
    const remindersJson = await AsyncStorage.getItem('reportReminders') || '[]';
    return JSON.parse(remindersJson);
  } catch (error) {
    console.error('Error getting report reminders:', error);
    return [];
  }
}

// Проверка и отправка запланированных напоминаний
export async function checkAndSendReminders() {
  try {
    const currentDate = new Date();
    
    // Проверка напоминаний о родительских собраниях
    const meetingReminders = await getMeetingReminders();
    for (const reminder of meetingReminders) {
      const meetingDate = new Date(reminder.date as string);
      
      // Если собрание завтра, отправляем напоминание
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (
        meetingDate.getDate() === tomorrow.getDate() &&
        meetingDate.getMonth() === tomorrow.getMonth() &&
        meetingDate.getFullYear() === tomorrow.getFullYear()
      ) {
        await sendLocalNotification(
          'Напоминание о родительском собрании',
          `Завтра состоится родительское собрание для группы ${reminder.data?.groupName || 'вашей группы'}`,
          { type: 'PARENT_MEETING', ...reminder.data }
        );
      }
    }
    
    // Проверка напоминаний о сроках отчетов
    const reportReminders = await getReportReminders();
    for (const reminder of reportReminders) {
      const dueDate = new Date(reminder.date as string);
      
      // Если срок через 3 дня, отправляем напоминание
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      
      if (
        dueDate.getDate() === threeDaysLater.getDate() &&
        dueDate.getMonth() === threeDaysLater.getMonth() &&
        dueDate.getFullYear() === threeDaysLater.getFullYear()
      ) {
        await sendLocalNotification(
          'Напоминание о формировании отчета',
          `Через 3 дня истекает срок формирования ${reminder.data?.reportType || 'отчета'}`,
          { type: 'REPORT_DUE', ...reminder.data }
        );
      }
      
      // Если срок завтра, отправляем напоминание
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (
        dueDate.getDate() === tomorrow.getDate() &&
        dueDate.getMonth() === tomorrow.getMonth() &&
        dueDate.getFullYear() === tomorrow.getFullYear()
      ) {
        await sendLocalNotification(
          'Напоминание о формировании отчета',
          `Завтра истекает срок формирования ${reminder.data?.reportType || 'отчета'}`,
          { type: 'REPORT_DUE', ...reminder.data }
        );
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking and sending reminders:', error);
    return false;
  }
}

// Проверка непрочитанных уведомлений
export async function checkUnreadNotifications() {
  try {
    // Получаем токен аутентификации
    const token = await AsyncStorage.getItem('token');
    if (!token) return 0;
    
    // Запрашиваем непрочитанные уведомления с сервера
    const response = await axios.get(`${config.apiUrl}/api/notifications/unread`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data && response.data.count !== undefined) {
      return response.data.count;
    }
    
    return 0;
  } catch (error) {
    console.error('Error checking unread notifications:', error);
    return 0;
  }
}

// Получение всех уведомлений с сервера
export async function fetchNotifications() {
  try {
    // Получаем токен аутентификации
    const token = await AsyncStorage.getItem('token');
    if (!token) return [];
    
    // Запрашиваем уведомления с сервера
    const response = await axios.get(`${config.apiUrl}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
} 