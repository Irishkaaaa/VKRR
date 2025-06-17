import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { Feedback } from '../services/feedbackService';

// Получение ширины экрана для графиков
const screenWidth = Dimensions.get('window').width - 40;

interface FeedbackChartProps {
  feedbacks: Feedback[];
  type: 'bar' | 'pie' | 'line';
  title: string;
  student?: boolean; // Если true, то график для студента, иначе для группы
}

const FeedbackChart: React.FC<FeedbackChartProps> = ({ feedbacks, type, title, student = false }) => {
  // Получить данные о положительных, отрицательных и нейтральных отзывах
  const positiveCount = feedbacks.filter(item => item.rating >= 4).length;
  const negativeCount = feedbacks.filter(item => item.rating <= 2).length;
  const neutralCount = feedbacks.filter(item => item.rating === 3).length;

  // Если нет данных, отображаем сообщение
  if (feedbacks.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.noData}>Нет данных для отображения</Text>
      </View>
    );
  }

  // Данные для гистограммы и круговой диаграммы
  const barData = {
    labels: ['Положительные', 'Нейтральные', 'Отрицательные'],
    datasets: [
      {
        data: [positiveCount, neutralCount, negativeCount],
        colors: [
          (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
          (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
          (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
        ],
      },
    ],
  };

  // Данные для круговой диаграммы
  const pieData = [
    {
      name: 'Положительные',
      population: positiveCount,
      color: 'rgba(46, 204, 113, 1)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Нейтральные',
      population: neutralCount,
      color: 'rgba(52, 152, 219, 1)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Отрицательные',
      population: negativeCount,
      color: 'rgba(231, 76, 60, 1)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
  ];

  // Данные для линейного графика (тренд по времени)
  const getLineData = () => {
    // Сортируем отзывы по дате
    const sortedFeedbacks = [...feedbacks].sort(
      (a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime()
    );

    // Формируем данные для каждого месяца или недели
    const periodData: { [key: string]: { positive: number; negative: number; neutral: number } } = {};

    sortedFeedbacks.forEach(feedback => {
      const date = new Date(feedback.date || feedback.createdAt);
      const month = `${date.getMonth() + 1}/${date.getFullYear()}`;

      if (!periodData[month]) {
        periodData[month] = { positive: 0, negative: 0, neutral: 0 };
      }

      if (feedback.rating >= 4) periodData[month].positive++;
      else if (feedback.rating <= 2) periodData[month].negative++;
      else periodData[month].neutral++;
    });

    // Преобразуем данные для графика
    const labels = Object.keys(periodData);
    const positive = labels.map(label => periodData[label].positive);
    const negative = labels.map(label => periodData[label].negative);

    return {
      labels,
      datasets: [
        {
          data: positive,
          color: () => 'rgba(46, 204, 113, 1)',
          strokeWidth: 2,
        },
        {
          data: negative,
          color: () => 'rgba(231, 76, 60, 1)',
          strokeWidth: 2,
        },
      ],
      legend: ['Положительные', 'Отрицательные'],
    };
  };

  // Общие настройки графиков
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
  };

  // Выбираем тип графика
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart
            data={barData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            showValuesOnTopOfBars
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
          />
        );
      case 'pie':
        return (
          <PieChart
            data={pieData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        );
      case 'line':
        return (
          <LineChart
            data={getLineData()}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>{renderChart()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  noData: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#666',
  },
  chartContainer: {
    alignItems: 'center',
  },
});

export default FeedbackChart; 