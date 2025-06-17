import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Card, Title, Button, Paragraph, Divider, Text, RadioButton } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useFeedback } from '../context/FeedbackContext';
import * as studentService from '../services/studentService';
import * as reportService from '../services/reportService';
import FeedbackChart from '../components/FeedbackChart';

// Используем тип Student из сервиса
import { Student } from '../services/studentService';

const ReportsScreen = () => {
  const { feedbacks, loadFeedbacks, isLoading: feedbacksLoading } = useFeedback();
  const [reportType, setReportType] = useState<reportService.ReportType>('group');
  const [reportPeriod, setReportPeriod] = useState<reportService.ReportPeriod>('week');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<{id: string; name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Загружаем отзывы и студентов при монтировании компонента
  useEffect(() => {
    loadData();
  }, []);

  // Загрузка всех данных
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Загружаем отзывы
      await loadFeedbacks();
      
      // Загружаем студентов
      const studentsData = await studentService.getAllStudents();
      setStudents(studentsData);
      
      // Получаем уникальные группы из данных студентов
      const uniqueGroups = [...new Set(studentsData.map(student => student.group))];
      const groupsData = uniqueGroups.map(group => ({
        id: group,
        name: group
      }));
      
      setGroups(groupsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные для отчета');
    } finally {
      setIsLoading(false);
    }
  };

  // Получение отфильтрованных студентов (по выбранной группе)
  const filteredStudents = selectedGroup
    ? students.filter(student => student.group === selectedGroup)
    : students;

  // Генерируем отчет (текстовый вариант в приложении)
  const generateReport = () => {
    try {
      let report = '';
      const now = new Date();
      let startDate = new Date();
      
      // Установка начальной даты в зависимости от периода
      if (reportPeriod === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (reportPeriod === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (reportPeriod === 'semester') {
        startDate.setMonth(now.getMonth() - 6);
      }

      // Фильтрация отзывов по дате
      const filteredFeedbacks = feedbacks.filter(item => {
        const itemDate = new Date(item.date || item.createdAt);
        return itemDate >= startDate && itemDate <= now;
      });

      if (reportType === 'group') {
        if (!selectedGroup) {
          Alert.alert('Ошибка', 'Пожалуйста, выберите группу');
          return;
        }

        // Находим имя группы
        const groupName = selectedGroup;
        
        // Фильтруем отзывы для студентов выбранной группы
        const groupFeedbacks = filteredFeedbacks.filter(item => 
          item.student && item.student.group && item.student.group === selectedGroup
        );
        
        const positiveCount = groupFeedbacks.filter(item => item.rating >= 4).length;
        const negativeCount = groupFeedbacks.filter(item => item.rating <= 2).length;
        
        // Находим студентов с положительной динамикой
        const studentFeedbacks: Record<string, any[]> = {};
        
        groupFeedbacks.forEach(feedback => {
          const studentId = feedback.studentId;
          if (!studentFeedbacks[studentId]) {
            studentFeedbacks[studentId] = [];
          }
          studentFeedbacks[studentId].push(feedback);
        });
        
        const improvingStudents: string[] = [];
        
        Object.entries(studentFeedbacks).forEach(([studentId, feedbacks]) => {
          if (feedbacks.length >= 2) {
            const sortedFeedbacks = [...feedbacks].sort((a, b) => 
              new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime()
            );
            
            const midpoint = Math.floor(sortedFeedbacks.length / 2);
            const recentFeedbacks = sortedFeedbacks.slice(midpoint);
            const earlierFeedbacks = sortedFeedbacks.slice(0, midpoint);
            
            const recentPositiveRatio = recentFeedbacks.filter(f => f.rating >= 4).length / recentFeedbacks.length;
            const earlierPositiveRatio = earlierFeedbacks.filter(f => f.rating >= 4).length / earlierFeedbacks.length;
            
            if (recentPositiveRatio > earlierPositiveRatio) {
              const student = students.find(s => s._id === studentId);
              if (student) {
                improvingStudents.push(student.name);
              }
            }
          }
        });
        
        // Формирование текстового отчета
        report = `Отчет по успеваемости группы\n\n`
          + `В период с ${startDate.toLocaleDateString()} по ${now.toLocaleDateString()} `
          + `средняя успеваемость группы ${groupName} была ${positiveCount > negativeCount ? 'стабильной' : 'требует улучшения'}.\n\n`
          + `Количество положительных комментариев о студентах: ${positiveCount}\n`
          + `Количество отрицательных комментариев: ${negativeCount}\n\n`;
          
        if (improvingStudents.length > 0) {
          report += `Устойчивый рост успеваемости был отмечен у студентов: ${improvingStudents.join(', ')}.`;
        } else {
          report += `За этот период ни у одного студента не наблюдалось устойчивого улучшения.`;
        }
      } else {
        // Отчет по студенту
        if (!selectedStudent) {
          Alert.alert('Ошибка', 'Пожалуйста, выберите студента');
          return;
        }

        // Находим отзывы для выбранного студента
        const studentFeedbacks = filteredFeedbacks.filter(item => item.studentId === selectedStudent);
        const student = students.find(s => s._id === selectedStudent);
        
        if (!student) {
          Alert.alert('Ошибка', 'Студент не найден');
          return;
        }
        
        const positiveCount = studentFeedbacks.filter(item => item.rating >= 4).length;
        const negativeCount = studentFeedbacks.filter(item => item.rating <= 2).length;
        
        // Анализ отзывов (наиболее частые темы)
        const feedbackTexts: Record<string, number> = {};
        studentFeedbacks.forEach(item => {
          if (!feedbackTexts[item.feedbackText]) {
            feedbackTexts[item.feedbackText] = 0;
          }
          feedbackTexts[item.feedbackText]++;
        });
        
        const sortedTopics = Object.entries(feedbackTexts)
          .sort(([, countA], [, countB]) => countB - countA)
          .slice(0, 3)
          .map(([topic]) => topic);
        
        // Определяем области для улучшения
        const weaknesses = [...new Set(
          studentFeedbacks
            .filter(item => item.rating <= 2)
            .map(item => item.feedbackText)
        )].slice(0, 3);
        
        // Формирование текстового отчета
        report = `Индивидуальный отчет по студенту\n\n`
          + `Студент ${student.name} в период с ${startDate.toLocaleDateString()} по ${now.toLocaleDateString()} `
          + `получил ${positiveCount} положительных и ${negativeCount} отрицательных комментариев.\n\n`;
          
        if (sortedTopics.length > 0) {
          report += `Наиболее частые темы отзывов: ${sortedTopics.join(', ')}.\n\n`;
        }
        
        if (weaknesses.length > 0) {
          report += `Рекомендуем студенту обратить внимание на: ${weaknesses.join(', ')} для улучшения успеваемости.`;
        } else {
          report += `Студент хорошо справляется по всем направлениям.`;
        }
      }

      setReportContent(report);
      setReportGenerated(true);
    } catch (error) {
      console.error('Ошибка генерации отчета:', error);
      Alert.alert('Ошибка', 'Не удалось сгенерировать отчет');
    }
  };

  // Генерация PDF отчета
  const generatePdfReport = async () => {
    if (reportType === 'group' && !selectedGroup) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите группу');
      return;
    }
    
    if (reportType === 'student' && !selectedStudent) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите студента');
      return;
    }
    
    try {
      setIsGeneratingPdf(true);
      
      // Находим данные выбранной группы или студента
      const selectedGroupName = groups.find(g => g.id === selectedGroup)?.name || '';
      const selectedStudentName = students.find(s => s._id === selectedStudent)?.name || '';
      
      // Формируем параметры для генерации отчета
      const options: reportService.ReportOptions = {
        reportType,
        reportPeriod,
        feedbacks,
        selectedGroupId: selectedGroup,
        selectedGroupName,
        selectedStudentId: selectedStudent,
        selectedStudentName,
        students
      };
      
      // Генерируем и открываем PDF
      await reportService.generateAndShareReport(options);
    } catch (error) {
      console.error('Ошибка при создании PDF:', error);
      Alert.alert('Ошибка', 'Не удалось создать PDF отчет');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Получение отфильтрованных отзывов для графиков
  const getFilteredFeedbacks = () => {
    const now = new Date();
    let startDate = new Date();
    
    // Установка начальной даты в зависимости от периода
    if (reportPeriod === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (reportPeriod === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (reportPeriod === 'semester') {
      startDate.setMonth(now.getMonth() - 6);
    }

    // Фильтрация отзывов по дате
    const filteredByDate = feedbacks.filter(item => {
      const itemDate = new Date(item.date || item.createdAt);
      return itemDate >= startDate && itemDate <= now;
    });

    // Фильтрация по группе или студенту
    if (reportType === 'group' && selectedGroup) {
      return filteredByDate.filter(item => 
        item.student && item.student.group === selectedGroup
      );
    } else if (reportType === 'student' && selectedStudent) {
      return filteredByDate.filter(item => item.studentId === selectedStudent);
    }
    
    return filteredByDate;
  };

  // Отображение компонента
  if (isLoading || feedbacksLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка данных...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Формирование отчета</Title>
          
          <Text style={styles.sectionTitle}>Тип отчета</Text>
          <RadioButton.Group onValueChange={value => {
            setReportType(value as reportService.ReportType);
            setReportGenerated(false);
          }} value={reportType}>
            <View style={styles.radioRow}>
              <RadioButton.Item label="Отчет по группе" value="group" />
            </View>
            <View style={styles.radioRow}>
              <RadioButton.Item label="Отчет по студенту" value="student" />
            </View>
          </RadioButton.Group>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Период времени</Text>
          <RadioButton.Group onValueChange={value => {
            setReportPeriod(value as reportService.ReportPeriod);
            setReportGenerated(false);
          }} value={reportPeriod}>
            <View style={styles.radioRow}>
              <RadioButton.Item label="Последняя неделя" value="week" />
            </View>
            <View style={styles.radioRow}>
              <RadioButton.Item label="Последний месяц" value="month" />
            </View>
            <View style={styles.radioRow}>
              <RadioButton.Item label="Последний семестр" value="semester" />
            </View>
          </RadioButton.Group>
          
          <Divider style={styles.divider} />
          
          {reportType === 'group' ? (
            <View>
              <Text style={styles.sectionTitle}>Выберите группу</Text>
              <Picker
                selectedValue={selectedGroup}
                onValueChange={(itemValue: string) => {
                  setSelectedGroup(itemValue);
                  setReportGenerated(false);
                }}
              >
                <Picker.Item label="Выберите группу" value="" />
                {groups.map(group => (
                  <Picker.Item key={group.id} label={group.name} value={group.id} />
                ))}
              </Picker>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>Выберите студента</Text>
              {selectedGroup && (
                <Text style={styles.filterNote}>
                  Фильтрация по группе: {groups.find(g => g.id === selectedGroup)?.name}
                  {' '}
                  <Text style={styles.clearFilter} onPress={() => setSelectedGroup('')}>
                    (Очистить)
                  </Text>
                </Text>
              )}
              <Picker
                selectedValue={selectedStudent}
                onValueChange={(itemValue: string) => {
                  setSelectedStudent(itemValue);
                  setReportGenerated(false);
                }}
              >
                <Picker.Item label="Выберите студента" value="" />
                {filteredStudents.map(student => (
                  <Picker.Item key={student._id} label={student.name} value={student._id} />
                ))}
              </Picker>
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              onPress={generateReport}
              style={styles.generateButton}
            >
              Просмотреть отчет
            </Button>
            
            <Button 
              mode="contained" 
              onPress={generatePdfReport}
              loading={isGeneratingPdf}
              style={styles.pdfButton}
              icon="file-pdf"
            >
              Сформировать PDF
            </Button>
          </View>
        </Card.Content>
      </Card>
      
      {reportGenerated && (
        <Card style={styles.reportCard}>
          <Card.Content>
            <Title style={styles.reportTitle}>
              {reportType === 'group' ? 'Отчет по группе' : 'Отчет по студенту'}
            </Title>
            <Paragraph style={styles.reportContent}>
              {reportContent}
            </Paragraph>
          </Card.Content>
        </Card>
      )}
      
      {reportGenerated && (
        <View>
          <FeedbackChart 
            feedbacks={getFilteredFeedbacks()}
            type="bar"
            title="Распределение отзывов"
            student={reportType === 'student'}
          />
          
          {getFilteredFeedbacks().length >= 5 && (
            <FeedbackChart 
              feedbacks={getFilteredFeedbacks()}
              type="line"
              title="Динамика отзывов по времени"
              student={reportType === 'student'}
            />
          )}
          
          <FeedbackChart 
            feedbacks={getFilteredFeedbacks()}
            type="pie"
            title="Соотношение типов отзывов"
            student={reportType === 'student'}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  reportCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
    backgroundColor: '#f9f9f9',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  reportTitle: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#007AFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: 16,
    flexDirection: 'column',
    gap: 10,
  },
  generateButton: {
    marginBottom: 8,
  },
  pdfButton: {
    backgroundColor: '#E74C3C',
  },
  reportContent: {
    lineHeight: 24,
    marginBottom: 16,
  },
  filterNote: {
    fontStyle: 'italic',
    marginBottom: 8,
    fontSize: 12,
  },
  clearFilter: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default ReportsScreen; 