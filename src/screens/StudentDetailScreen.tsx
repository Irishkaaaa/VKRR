import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Card, Title, Paragraph, FAB, Chip, Divider, Text, ProgressBar } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFeedback } from '../context/FeedbackContext';
import { Feedback } from '../services/feedbackService';

type Props = NativeStackScreenProps<any, 'StudentDetail'>;

const StudentDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const params = route.params as { studentId: string; studentName: string };
  const { studentId, studentName } = params;
  const { getFeedbackByStudent } = useFeedback();
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([]);
  const [stats, setStats] = useState({
    positive: 0,
    negative: 0,
    neutral: 0,
    total: 0,
  });

  // Load student feedback data
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const studentFeedback = await getFeedbackByStudent(studentId);
        setFeedbackItems(studentFeedback);
        
        // Calculate statistics
        const positive = studentFeedback.filter(item => item.rating >= 4).length;
        const negative = studentFeedback.filter(item => item.rating <= 2).length;
        const neutral = studentFeedback.filter(item => item.rating === 3).length;
        
        setStats({
          positive,
          negative,
          neutral,
          total: studentFeedback.length,
        });
      } catch (error) {
        console.error('Failed to fetch feedback:', error);
      }
    };

    fetchFeedback();
  }, [studentId, getFeedbackByStudent]);

  // Преобразуем оценку в тип отзыва
  const getRatingType = (rating: number): 'positive' | 'negative' | 'neutral' => {
    if (rating >= 4) return 'positive';
    if (rating <= 2) return 'negative';
    return 'neutral';
  };

  // Function to get color based on feedback type
  const getTypeColor = (rating: number) => {
    const type = getRatingType(rating);
    if (type === 'positive') return '#4CAF50';
    if (type === 'negative') return '#F44336';
    return '#2196F3';
  };

  // Get type name in Russian
  const getTypeName = (rating: number) => {
    const type = getRatingType(rating);
    if (type === 'positive') return 'Положительный';
    if (type === 'negative') return 'Отрицательный';
    return 'Нейтральный';
  };

  // Calculate ratio for progress bars
  const getProgressRatio = (count: number) => {
    return stats.total > 0 ? count / stats.total : 0;
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Student statistics section */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.title}>Статистика отзывов</Title>
            
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>Всего отзывов: {stats.total}</Text>
            </View>
            
            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={[styles.progressLabel, { color: '#4CAF50' }]}>
                  Положительные: {stats.positive} ({((getProgressRatio(stats.positive) * 100) || 0).toFixed(0)}%)
                </Text>
                <ProgressBar progress={getProgressRatio(stats.positive)} color="#4CAF50" style={styles.progressBar} />
              </View>
              
              <View style={styles.progressRow}>
                <Text style={[styles.progressLabel, { color: '#F44336' }]}>
                  Отрицательные: {stats.negative} ({((getProgressRatio(stats.negative) * 100) || 0).toFixed(0)}%)
                </Text>
                <ProgressBar progress={getProgressRatio(stats.negative)} color="#F44336" style={styles.progressBar} />
              </View>
              
              <View style={styles.progressRow}>
                <Text style={[styles.progressLabel, { color: '#2196F3' }]}>
                  Нейтральные: {stats.neutral} ({((getProgressRatio(stats.neutral) * 100) || 0).toFixed(0)}%)
                </Text>
                <ProgressBar progress={getProgressRatio(stats.neutral)} color="#2196F3" style={styles.progressBar} />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Feedback list section */}
        <Title style={styles.feedbackTitle}>История отзывов</Title>
        
        {feedbackItems.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Paragraph>Нет отзывов для этого студента.</Paragraph>
            </Card.Content>
          </Card>
        ) : (
          feedbackItems.map(item => (
            <Card key={item._id} style={styles.card}>
              <Card.Content>
                <View style={styles.headerRow}>
                  <Chip style={styles.subjectChip}>{item.subject}</Chip>
                  <Chip style={[styles.typeChip, { backgroundColor: getTypeColor(item.rating) } as any]}>
                    {getTypeName(item.rating)}
                  </Chip>
                </View>
                <Divider style={styles.divider} />
                <Paragraph style={styles.content}>{item.feedbackText}</Paragraph>
                <Paragraph style={styles.date}>
                  {new Date(item.date || item.createdAt).toLocaleDateString()}, {new Date(item.date || item.createdAt).toLocaleTimeString()} 
                  от {item.teacher?.username || 'Неизвестный преподаватель'}
                </Paragraph>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddFeedback', { 
          studentId, 
          studentName,
          groupId: feedbackItems[0]?.student?.group || '',
          groupName: feedbackItems[0]?.student?.group || '',
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsCard: {
    margin: 16,
    elevation: 2,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statsText: {
    fontSize: 16,
  },
  progressSection: {
    marginTop: 8,
  },
  progressRow: {
    marginBottom: 12,
  },
  progressLabel: {
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  feedbackTitle: {
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  card: {
    margin: 8,
    marginHorizontal: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  subjectChip: {
    marginRight: 8,
  },
  typeChip: {
    color: 'white',
  },
  divider: {
    marginVertical: 8,
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
});

export default StudentDetailScreen; 