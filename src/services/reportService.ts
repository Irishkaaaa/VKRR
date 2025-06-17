import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Feedback } from './feedbackService';
import { Student } from './studentService';

// Тип отчета
export type ReportType = 'group' | 'student';

// Период отчета
export type ReportPeriod = 'week' | 'month' | 'semester';

// Интерфейс для генерации отчета
export interface ReportOptions {
  reportType: ReportType;
  reportPeriod: ReportPeriod;
  feedbacks: Feedback[];
  selectedGroupId?: string;
  selectedGroupName?: string;
  selectedStudentId?: string;
  selectedStudentName?: string;
  students: Student[];
}

/**
 * Генерирует HTML для графика на основе данных отзывов
 */
const generateChartHtml = (feedbacks: Feedback[], title: string) => {
  // Подсчет отзывов
  const positiveCount = feedbacks.filter(item => item.rating >= 4).length;
  const neutralCount = feedbacks.filter(item => item.rating === 3).length;
  const negativeCount = feedbacks.filter(item => item.rating <= 2).length;

  // Если нет данных
  if (feedbacks.length === 0) {
    return `
      <div style="text-align: center; margin: 20px 0;">
        <h3>${title}</h3>
        <p>Нет данных для отображения</p>
      </div>
    `;
  }

  // Создаем диаграмму на основе данных
  return `
    <div style="text-align: center; margin: 20px 0;">
      <h3>${title}</h3>
      <div>
        <div style="display: flex; justify-content: space-around; margin-bottom: 10px;">
          <div style="height: 20px; width: 20px; background-color: #2ecc71; margin-right: 5px;"></div>
          <span>Положительные (${positiveCount})</span>
          
          <div style="height: 20px; width: 20px; background-color: #3498db; margin-right: 5px;"></div>
          <span>Нейтральные (${neutralCount})</span>
          
          <div style="height: 20px; width: 20px; background-color: #e74c3c; margin-right: 5px;"></div>
          <span>Отрицательные (${negativeCount})</span>
        </div>
        <div style="width: 100%;">
          <div style="display: flex; height: 30px; border-radius: 15px; overflow: hidden;">
            <div style="width: ${(positiveCount / feedbacks.length) * 100}%; background-color: #2ecc71;"></div>
            <div style="width: ${(neutralCount / feedbacks.length) * 100}%; background-color: #3498db;"></div>
            <div style="width: ${(negativeCount / feedbacks.length) * 100}%; background-color: #e74c3c;"></div>
          </div>
        </div>
      </div>
    </div>
  `;
};

/**
 * Генерирует HTML шаблон для отчета
 */
const generateReportHtml = (options: ReportOptions): string => {
  const { reportType, reportPeriod, feedbacks, selectedGroupName, selectedStudentName } = options;
  
  // Определяем заголовок отчета
  const reportTitle = reportType === 'group' 
    ? `Отчет по группе ${selectedGroupName || ''}`
    : `Отчет по студенту ${selectedStudentName || ''}`;
  
  // Определяем период
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

  // Текстовое описание периода
  const periodText = reportPeriod === 'week'
    ? 'за последнюю неделю'
    : reportPeriod === 'month'
      ? 'за последний месяц'
      : 'за последний семестр';
  
  // Фильтрация отзывов по периоду
  const filteredFeedbacks = feedbacks.filter(item => {
    const itemDate = new Date(item.date || item.createdAt);
    return itemDate >= startDate && itemDate <= now;
  });

  // Отбор отзывов по группе или студенту
  let reportFeedbacks: Feedback[] = [];
  
  if (reportType === 'group' && options.selectedGroupId) {
    reportFeedbacks = filteredFeedbacks.filter(item => 
      item.student && item.student.group && 
      item.student.group.toLowerCase() === options.selectedGroupName?.toLowerCase()
    );
  } else if (reportType === 'student' && options.selectedStudentId) {
    reportFeedbacks = filteredFeedbacks.filter(item => 
      item.studentId === options.selectedStudentId
    );
  }

  // Получение статистики
  const positiveCount = reportFeedbacks.filter(item => item.rating >= 4).length;
  const negativeCount = reportFeedbacks.filter(item => item.rating <= 2).length;
  const neutralCount = reportFeedbacks.filter(item => item.rating === 3).length;
  
  // Генерация содержимого отчета
  let reportContent = '';
  
  if (reportType === 'group') {
    // Группировка студентов по отзывам
    const studentFeedbacks: Record<string, Feedback[]> = {};
    
    reportFeedbacks.forEach(feedback => {
      const studentId = feedback.studentId;
      if (!studentFeedbacks[studentId]) {
        studentFeedbacks[studentId] = [];
      }
      studentFeedbacks[studentId].push(feedback);
    });
    
    // Определение студентов с положительной тенденцией
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
          const student = options.students.find(s => s._id === studentId);
          if (student) {
            improvingStudents.push(student.name);
          }
        }
      }
    });

    // Формирование текстового отчета для группы
    reportContent = `
      <p>В период с ${startDate.toLocaleDateString()} по ${now.toLocaleDateString()} 
         средняя успеваемость группы ${selectedGroupName} была 
         ${positiveCount > negativeCount ? 'удовлетворительной' : 'требует улучшения'}.</p>
      
      <p>Количество положительных комментариев о студентах: ${positiveCount}</p>
      <p>Количество отрицательных комментариев: ${negativeCount}</p>
      <p>Количество нейтральных комментариев: ${neutralCount}</p>
      
      ${improvingStudents.length > 0 
        ? `<p>Устойчивый рост успеваемости был отмечен у студентов: ${improvingStudents.join(', ')}.</p>`
        : `<p>За этот период ни у одного студента не наблюдалось устойчивого улучшения.</p>`
      }
    `;
  } else {
    // Анализ отзывов для конкретного студента
    const subjects: Record<string, number> = {};
    const feedbackTexts: Record<string, number> = {};
    
    reportFeedbacks.forEach(feedback => {
      // Подсчет по предметам
      if (!subjects[feedback.subject]) {
        subjects[feedback.subject] = 0;
      }
      subjects[feedback.subject]++;
      
      // Подсчет повторяющихся отзывов
      if (!feedbackTexts[feedback.feedbackText]) {
        feedbackTexts[feedback.feedbackText] = 0;
      }
      feedbackTexts[feedback.feedbackText]++;
    });
    
    // Топ-3 предмета
    const topSubjects = Object.entries(subjects)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([subject]) => subject);
    
    // Топ-3 отзыва
    const topFeedbacks = Object.entries(feedbackTexts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([text]) => text);
    
    // Слабые стороны (из отрицательных отзывов)
    const weaknesses = [...new Set(
      reportFeedbacks
        .filter(item => item.rating <= 2)
        .map(item => item.feedbackText)
    )].slice(0, 3);
    
    // Формирование текстового отчета для студента
    reportContent = `
      <p>Студент ${selectedStudentName} в период с ${startDate.toLocaleDateString()} по ${now.toLocaleDateString()}
         получил ${positiveCount} положительных, ${neutralCount} нейтральных и ${negativeCount} отрицательных комментариев.</p>
      
      ${topSubjects.length > 0 
        ? `<p>Наиболее часто комментируемые предметы: ${topSubjects.join(', ')}.</p>` 
        : ''}
      
      ${topFeedbacks.length > 0 
        ? `<p>Наиболее частые комментарии: ${topFeedbacks.join(', ')}.</p>` 
        : ''}
      
      ${weaknesses.length > 0 
        ? `<p>Рекомендуем обратить внимание на: ${weaknesses.join(', ')} для улучшения успеваемости.</p>`
        : `<p>Студент хорошо справляется по всем направлениям.</p>`
      }
    `;
  }

  // Полный HTML шаблон отчета
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${reportTitle}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
            margin: 20px;
            color: #333;
          }
          
          h1 {
            color: #007AFF;
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
          }
          
          .report-info {
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          
          .report-content {
            margin-bottom: 20px;
          }
          
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #777;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <h1>${reportTitle}</h1>
        
        <div class="report-info">
          <p><strong>Период:</strong> ${periodText} (${startDate.toLocaleDateString()} - ${now.toLocaleDateString()})</p>
          <p><strong>Тип отчета:</strong> ${reportType === 'group' ? 'По группе' : 'По студенту'}</p>
          <p><strong>Всего отзывов:</strong> ${reportFeedbacks.length}</p>
        </div>
        
        <div class="report-content">
          ${reportContent}
        </div>
        
        ${generateChartHtml(reportFeedbacks, 'Соотношение типов отзывов')}
        
        <div class="footer">
          <p>Отчет сформирован: ${new Date().toLocaleString()}</p>
          <p>Система обратной связи для преподавателей</p>
        </div>
      </body>
    </html>
  `;
};

/**
 * Генерирует и экспортирует PDF отчет
 */
export const generateAndShareReport = async (options: ReportOptions): Promise<void> => {
  try {
    // Генерация HTML для отчета
    const html = generateReportHtml(options);
    
    // Создание PDF из HTML
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false
    });
    
    // Проверка, доступно ли общий доступ
    if (await Sharing.isAvailableAsync()) {
      // Открытие диалога для совместного использования
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Поделиться отчетом',
        UTI: 'com.adobe.pdf'
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
}; 