import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Title, Paragraph, FAB, Chip, Searchbar, Divider } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';
import { Feedback } from '../services/feedbackService';

type Props = NativeStackScreenProps<any, 'FeedbackList'>;

const FeedbackListScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { feedbacks, loadFeedbacks, isLoading } = useFeedback();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<{
    type?: 'positive' | 'negative' | 'neutral';
    subject?: string;
  }>({});
  const [displayFeedbacks, setDisplayFeedbacks] = useState<Feedback[]>([]);

  // Загружаем отзывы при монтировании компонента
  useEffect(() => {
    loadFeedbacks();
  }, []);

  // Преобразуем оценку в тип отзыва
  const getRatingType = (rating: number): 'positive' | 'negative' | 'neutral' => {
    if (rating >= 4) return 'positive';
    if (rating <= 2) return 'negative';
    return 'neutral';
  };

  // Фильтруем и обновляем отзывы при изменении данных
  useEffect(() => {
    console.log('Фильтрация отзывов. Всего отзывов:', feedbacks.length);
    console.log('Текущий пользователь:', JSON.stringify(user, null, 2));
    
    // Отладочный вывод для проверки групп
    if (user?.role === 'classTeacher' && user.group) {
      console.log('Группа пользователя:', user.group);
      const groupFeedbacks = feedbacks.filter(item => 
        item.student && item.student.group && 
        item.student.group.trim().toLowerCase() === user.group!.trim().toLowerCase()
      );
      console.log(`Найдено отзывов для группы ${user.group}: ${groupFeedbacks.length}`);
    }
    
    // Получаем все отзывы и фильтруем их
    const filtered = feedbacks.filter(item => {
      // ВРЕМЕННО ОТКЛЮЧАЕМ ФИЛЬТР ПО РОЛИ ДЛЯ ТЕСТИРОВАНИЯ
      // Просто выводим информацию без фильтрации
      if (user?.role === 'classTeacher' && user.group && item.student?.group) {
        const userGroupNormalized = user.group.trim().toLowerCase();
        const studentGroupNormalized = item.student.group.trim().toLowerCase();
        
        console.log(`Сравнение групп: '${studentGroupNormalized}' === '${userGroupNormalized}' = ${studentGroupNormalized === userGroupNormalized}`);
        
        // Для отладки НЕ фильтруем, а только логируем
        // return studentGroupNormalized === userGroupNormalized;
      }

      // Поиск по тексту
      const searchableText = [
        item.student?.name || '',
        item.feedbackText,
        item.subject
      ].join(' ').toLowerCase();
      
      if (searchQuery && !searchableText.includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Фильтр по типу отзыва
      const type = getRatingType(item.rating);
      if (selectedFilters.type && type !== selectedFilters.type) {
        return false;
      }

      // Фильтр по предмету
      if (selectedFilters.subject && item.subject !== selectedFilters.subject) {
        return false;
      }

      return true;
    });

    console.log('Отзывы после фильтрации:', filtered.length);
    if (filtered.length === 0) {
      console.log('Не найдено отзывов после применения фильтров');
    } else {
      console.log('Первый отзыв после фильтрации:', JSON.stringify(filtered[0], null, 2));
      // Проверяем данные студента и преподавателя
      const firstItem = filtered[0];
      console.log('ID студента:', firstItem.studentId);
      console.log('Данные студента:', firstItem.student);
      console.log('ID преподавателя:', firstItem.teacherId);
      console.log('Данные преподавателя:', firstItem.teacher);
    }
    
    setDisplayFeedbacks(filtered);
  }, [feedbacks, searchQuery, selectedFilters, user]);

  // Получаем уникальные предметы для фильтрации
  const subjects = Array.from(new Set(feedbacks.map(item => item.subject)));

  // Функция для получения цвета на основе типа отзыва
  const getTypeColor = (rating: number) => {
    const type = getRatingType(rating);
    if (type === 'positive') return '#4CAF50';
    if (type === 'negative') return '#F44336';
    return '#2196F3';
  };

  // Получение названия типа на русском
  const getTypeName = (rating: number) => {
    const type = getRatingType(rating);
    if (type === 'positive') return 'Положительный';
    if (type === 'negative') return 'Отрицательный';
    return 'Нейтральный';
  };

  // Обработка выбора фильтра
  const toggleFilter = (filterType: 'type' | 'subject', value: any) => {
    setSelectedFilters(prev => {
      // Если фильтр уже выбран, удаляем его
      if (prev[filterType] === value) {
        const newFilters = { ...prev };
        delete newFilters[filterType];
        return newFilters;
      }
      // Иначе добавляем или обновляем фильтр
      return { ...prev, [filterType]: value };
    });
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Поиск отзывов"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            selected={selectedFilters.type === 'positive'}
            onPress={() => toggleFilter('type', 'positive')}
            style={[styles.chip, selectedFilters.type === 'positive' && styles.selectedChip]}
          >
            Положительные
          </Chip>
          <Chip
            selected={selectedFilters.type === 'negative'}
            onPress={() => toggleFilter('type', 'negative')}
            style={[styles.chip, selectedFilters.type === 'negative' && styles.selectedChip]}
          >
            Отрицательные
          </Chip>
          <Chip
            selected={selectedFilters.type === 'neutral'}
            onPress={() => toggleFilter('type', 'neutral')}
            style={[styles.chip, selectedFilters.type === 'neutral' && styles.selectedChip]}
          >
            Нейтральные
          </Chip>
          
          {subjects.map(subject => (
            <Chip
              key={subject}
              selected={selectedFilters.subject === subject}
              onPress={() => toggleFilter('subject', subject)}
              style={[styles.chip, selectedFilters.subject === subject && styles.selectedChip]}
            >
              {subject}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {displayFeedbacks.length > 0 ? (
        <FlatList
          data={displayFeedbacks}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <TouchableOpacity onPress={() => navigation.navigate('StudentDetail', { 
                  studentId: item.studentId,
                  studentName: item.student?.name || 'Неизвестный студент'
                })}>
                  <Title>
                    {item.student?.name || 
                     (typeof item.student === 'string' ? item.student : 'Неизвестный студент')}
                  </Title>
                </TouchableOpacity>
                <Paragraph style={styles.groupText}>Группа: {item.student?.group || 'Не указана'}</Paragraph>
                <Divider style={styles.divider} />
                <View style={styles.subjectRow}>
                  <Chip style={styles.subjectChip}>{item.subject || 'Не указан'}</Chip>
                  <Chip style={[styles.typeChip, { backgroundColor: item.rating ? getTypeColor(item.rating) : '#999999' } as any]}>
                    {item.rating ? getTypeName(item.rating) : 'Не указан'}
                  </Chip>
                </View>
                <Paragraph style={styles.content}>{item.feedbackText || 'Без текста'}</Paragraph>
                <Paragraph style={styles.date}>
                  {new Date(item.date || item.createdAt).toLocaleDateString()}, 
                  {new Date(item.date || item.createdAt).toLocaleTimeString()} 
                  от {item.teacher?.username || 
                     (typeof item.teacher === 'string' ? item.teacher : 'Неизвестный преподаватель')}
                </Paragraph>
              </Card.Content>
            </Card>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Paragraph style={styles.emptyText}>
            {isLoading ? 'Загрузка отзывов...' : 'Нет отзывов для отображения'}
          </Paragraph>
        </View>
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddFeedback')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 8,
    elevation: 2,
  },
  filtersContainer: {
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: '#e0e0e0',
  },
  card: {
    margin: 8,
    elevation: 2,
  },
  groupText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  subjectRow: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  subjectChip: {
    marginRight: 8,
  },
  typeChip: {
    color: 'white',
  },
  content: {
    marginVertical: 8,
    fontSize: 16,
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default FeedbackListScreen; 