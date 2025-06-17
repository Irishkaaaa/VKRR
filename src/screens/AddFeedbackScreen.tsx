import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { TextInput, Button, Chip, Surface, Title, Text, RadioButton, Divider } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';
import { CreateFeedbackData } from '../services/feedbackService';
import * as studentService from '../services/studentService';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<any, 'AddFeedback'>;

const SUBJECTS = ['JavaScript', 'Flutter', 'HTML/CSS', 'Информатика',
  'Русский язык', 'Литература', 'История', 'Введение в ОС',
  'СУБД ', 'ООП на С#', 'Английский язык', 'Физкультура',
  'Основы Java', 'Технологии ИИ', 'Тестирование ПО', '1С Битрикс'];

const FEEDBACK_PHRASES_RU = {
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

const AddFeedbackScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, checkAuth } = useAuth();
  const { addFeedback } = useFeedback();
  const [apiStudents, setApiStudents] = useState<studentService.Student[]>([]);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  
  const studentId = route.params?.studentId || '';
  const studentName = route.params?.studentName || '';
  const groupId = route.params?.groupId || '';
  const groupName = route.params?.groupName || '';

  const [selectedStudent, setSelectedStudent] = useState<{id: string; name: string; groupId?: string; groupName?: string} | null>(
    studentId ? { id: studentId, name: studentName, groupId, groupName } : null
  );
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | 'neutral'>('positive');
  const [customFeedback, setCustomFeedback] = useState('');
  const [selectedPhrases, setSelectedPhrases] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const verifyAuth = async () => {
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
          navigation.navigate('Login');
        }
      };
      verifyAuth();
    }, [navigation])
  );

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setFetchingStudents(true);
        const students = await studentService.getAllStudents();
        setApiStudents(students);
      } catch (error: any) {
        console.error('Ошибка при получении списка студентов:', error);
        if (error.message === 'Доступ запрещен. Токен не предоставлен' || error.response?.status === 401) {
          Alert.alert('Ошибка авторизации', 'Ваша сессия истекла. Пожалуйста, войдите снова.', [
            { text: 'OK', onPress: () => navigation.navigate('Login') }
          ]);
        } else {
          Alert.alert('Ошибка', 'Не удалось загрузить список студентов');
        }
      } finally {
        setFetchingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    setCustomFeedback(selectedPhrases.join('\n'));
  }, [selectedPhrases]);

  const handlePhraseSelection = (phrase: string) => {
    setSelectedPhrases(prev => 
      prev.includes(phrase) 
        ? prev.filter(p => p !== phrase) 
        : [...prev, phrase]
    );
  };

  const clearSelectedPhrases = () => {
    setSelectedPhrases([]);
  };

  const handleSubmit = async () => {
    if (!selectedStudent) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите студента');
      return;
    }

    if (!customFeedback.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите текст отзыва');
      return;
    }

    if (!user) {
      Alert.alert('Ошибка', 'Вы должны быть авторизованы');
      navigation.navigate('Login');
      return;
    }

    setLoading(true);
    
    try {
      const teacherId = user.id || (user as any)?._id;

      const feedbackData: CreateFeedbackData = {
        studentId: selectedStudent.id,
        teacherId,
        subject,
        feedbackText: customFeedback,
        rating: feedbackType === 'positive' ? 5 : 
               feedbackType === 'neutral' ? 3 : 1,
        date: new Date().toISOString()
      };
      
      const success = await addFeedback(feedbackData);
      
      if (success) {
        Alert.alert('Успех', 'Отзыв успешно добавлен', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Ошибка', 'Не удалось добавить отзыв');
      }
    } catch (error: any) {
      console.error('Ошибка при добавлении отзыва:', error);
      if (error.message === 'Доступ запрещен' || error.response?.status === 401) {
        Alert.alert('Ошибка авторизации', 'Пожалуйста, войдите снова', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Ошибка', 'Не удалось добавить отзыв');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Surface style={styles.surface}>
        <Title style={styles.title}>Добавление отзыва</Title>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Студент</Text>
          {fetchingStudents ? (
            <ActivityIndicator size="large" style={styles.loader} />
          ) : (
            <Picker
              selectedValue={selectedStudent?.id || ''}
              onValueChange={(itemValue) => {
                if (itemValue) {
                  const student = apiStudents.find(s => s._id === itemValue);
                  if (student) {
                    setSelectedStudent({
                      id: student._id,
                      name: student.name,
                      groupId: student.group,
                      groupName: student.group
                    });
                  }
                } else {
                  setSelectedStudent(null);
                }
              }}
            >
              <Picker.Item label="Выберите студента" value="" />
              {apiStudents.map(student => (
                <Picker.Item key={student._id} label={`${student.name} (${student.group})`} value={student._id} />
              ))}
            </Picker>
          )}
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Предмет</Text>
          <Picker
            selectedValue={subject}
            onValueChange={(itemValue) => setSubject(itemValue)}
          >
            {SUBJECTS.map(subj => (
              <Picker.Item key={subj} label={subj} value={subj} />
            ))}
          </Picker>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Тип отзыва</Text>
          <RadioButton.Group onValueChange={value => setFeedbackType(value as any)} value={feedbackType}>
            <View style={styles.radioRow}>
              <RadioButton.Item label="Положительный" value="positive" />
            </View>
            <View style={styles.radioRow}>
              <RadioButton.Item label="Отрицательный" value="negative" />
            </View>
            <View style={styles.radioRow}>
              <RadioButton.Item label="Нейтральный" value="neutral" />
            </View>
          </RadioButton.Group>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.phrasesHeader}>
            <Text style={styles.sectionTitle}>Шаблоны отзывов</Text>
            {selectedPhrases.length > 0 && (
              <Button 
                mode="text" 
                onPress={clearSelectedPhrases}
                style={styles.clearButton}
                labelStyle={styles.clearButtonText}
              >
                Очистить
              </Button>
            )}
          </View>
          <ScrollView horizontal style={styles.phrasesContainer} showsHorizontalScrollIndicator={false}>
            {FEEDBACK_PHRASES_RU[feedbackType].map((phrase, index) => (
              <Chip
                key={index}
                selected={selectedPhrases.includes(phrase)}
                onPress={() => handlePhraseSelection(phrase)}
                style={[
                  styles.phraseChip, 
                  selectedPhrases.includes(phrase) && styles.selectedChip
                ]}
              >
                {phrase}
              </Chip>
            ))}
          </ScrollView>
          {selectedPhrases.length > 0 && (
            <Text style={styles.selectedCount}>Выбрано: {selectedPhrases.length}</Text>
          )}
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Текст отзыва</Text>
          <TextInput
            value={customFeedback}
            onChangeText={setCustomFeedback}
            multiline
            numberOfLines={4}
            style={styles.feedbackInput}
            placeholder="Введите детали отзыва"
          />
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
          disabled={loading}
        >
          Отправить отзыв
        </Button>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  surface: {
    padding: 16,
    elevation: 4,
    borderRadius: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phrasesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phrasesContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  phraseChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: '#e0e0e0',
  },
  clearButton: {
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 12,
  },
  selectedCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  feedbackInput: {
    marginBottom: 16,
    minHeight: 100,
  },
  submitButton: {
    marginTop: 8,
  },
  loader: {
    marginVertical: 20,
  },
});

export default AddFeedbackScreen;