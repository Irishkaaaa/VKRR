import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, Divider, Switch, Text, Badge, Snackbar } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import * as notificationService from '../services/notificationService';
import { Notification } from '../services/notificationService';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminders, setReminders] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const enabled = await notificationService.getNotificationSettings();
        setNotificationsEnabled(enabled);
        await loadReminders();
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadNotificationSettings();
    notificationService.checkAndSendReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const meetingReminders = await notificationService.getMeetingReminders();
      const reportReminders = await notificationService.getReportReminders();
      const allReminders = [...meetingReminders, ...reportReminders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReminders(allReminders);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выйти из аккаунта');
    }
  };

  const updateNotificationSettings = async (enabled: boolean) => {
    try {
      setNotificationLoading(true);
      await notificationService.saveNotificationSettings(enabled);
      if (enabled) {
        await notificationService.initializeLocalNotifications();
      }
      setNotificationsEnabled(enabled);
      showSnackbar('Настройки уведомлений обновлены');
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      showSnackbar('Ошибка при обновлении настроек уведомлений');
    } finally {
      setNotificationLoading(false);
    }
  };

  const testNotification = async () => {
    try {
      setNotificationLoading(true);
      const initialized = await notificationService.initializeLocalNotifications();
      
      if (!initialized) {
        showSnackbar('Не удалось инициализировать уведомления. Проверьте разрешения.');
        return;
      }
      
      const notificationId = await notificationService.sendLocalNotification(
        'Тестовое уведомление',
        'Это тестовое уведомление отправлено из профиля',
        { type: 'SYSTEM' }
      );
      
      showSnackbar(notificationId 
        ? 'Тестовое уведомление отправлено успешно!' 
        : 'Ошибка отправки уведомления');
    } catch (error) {
      console.error('Ошибка при отправке тестового уведомления:', error);
      showSnackbar('Ошибка при отправке тестового уведомления');
    } finally {
      setNotificationLoading(false);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const renderRoleSpecificInfo = () => {
    if (user?.role === 'teacher' && user?.subjects?.length) {
      return (
        <View style={styles.roleInfoContainer}>
          <Text style={styles.roleInfoTitle}>Предметы:</Text>
          <View style={styles.itemsContainer}>
            {user.subjects.map((subject, index) => (
              <Badge key={index} style={styles.itemBadge}>
                {subject}
              </Badge>
            ))}
          </View>
        </View>
      );
    }

    if (user?.role === 'classTeacher' && user?.group) {
      return (
        <View style={styles.roleInfoContainer}>
          <Text style={styles.roleInfoTitle}>Группа:</Text>
          <Badge style={[styles.itemBadge, styles.groupBadge]}>
            {user.group}
          </Badge>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileHeader}>
            <Avatar.Text 
              size={80} 
              label={user?.username?.charAt(0)?.toUpperCase() || 'U'} 
              style={styles.avatar}
            />
            <Title style={styles.username}>{user?.username || 'User'}</Title>
            <Paragraph>{user?.email || 'Email не указан'}</Paragraph>
            <Paragraph style={styles.role}>
              {user?.role === 'teacher' ? 'Преподаватель' : 
               user?.role === 'classTeacher' ? 'Классный руководитель' : 
               user?.role === 'admin' ? 'Администратор' : 'Пользователь'}
            </Paragraph>
            
            {renderRoleSpecificInfo()}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Настройки</Title>
            <Divider style={styles.divider} />
            
            <View style={styles.settingRow}>
              <Text>Уведомления</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={updateNotificationSettings}
                color="#007AFF"
              />
            </View>
            
            <Paragraph style={styles.notificationStatus}>
              Статус: {notificationsEnabled ? 'Включены' : 'Выключены'}
              {notificationsEnabled && (
                <Text style={styles.italicText}>
                  {' '}(Проверьте настройки уведомлений в системе)
                </Text>
              )}
            </Paragraph>
          </Card.Content>
        </Card>

        <View style={styles.separator} />
        
        <Text style={styles.sectionTitle}>Тестирование уведомлений</Text>
        
        <Button
          mode="contained"
          onPress={testNotification}
          style={styles.button}
          loading={notificationLoading}
          disabled={!notificationsEnabled}
        >
          {notificationsEnabled 
            ? 'Отправить тестовое уведомление' 
            : 'Включите уведомления для тестирования'}
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.button}
        >
          Выйти
        </Button>
      </ScrollView>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  card: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatar: {
    marginBottom: 8,
    backgroundColor: '#007AFF',
  },
  username: {
    fontSize: 22,
    marginBottom: 2,
  },
  role: {
    fontSize: 16,
    color: '#666',
    marginBottom: 6,
  },
  roleInfoContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  roleInfoTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 5,
  },
  itemBadge: {
    margin: 5,
    backgroundColor: '#007AFF',
    color: 'white', // (это может не работать, лучше стилизовать текст отдельно)
    padding: 10,       // увеличивает внутренний отступ
    paddingHorizontal: 12, // дополнительный отступ по бокам
    borderRadius: 15,   // скругление углов
    fontSize: 12,       // (если Badge не принимает, нужно стилизовать текст внутри)
    height: 40,         // фиксированная высота (опционально)
    minWidth: 60,       // минимальная ширина (чтобы бейджи не были слишком узкими)
    justifyContent: 'center', // выравнивание по вертикали
    alignItems: 'center',     // выравнивание по горизонтали
  },
  groupBadge: {
    backgroundColor: '#4CAF50',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 16,
  },
  button: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  notificationStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  italicText: {
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    marginHorizontal: 16,
    marginBottom: 8,
  },
});

export default ProfileScreen;