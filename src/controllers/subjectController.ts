import { Request, Response } from 'express';

// Статичный список доступных предметов
const AVAILABLE_SUBJECTS = [
  'JavaScript', 'Flutter', 'HTML/CSS', 'Информатика',
  'Русский язык', 'Литература', 'История', 'Введение в ОС',
  'СУБД ', 'ООП на С#', 'Английский язык', 'Физкультура',
  'Основы Java', 'Технологии ИИ', 'Тестирование ПО', '1С Битрикс'
];

export const getSubjects = async (req: Request, res: Response) => {
  try {
    res.status(200).json(AVAILABLE_SUBJECTS);
  } catch (error) {
    console.error('Error getting subjects:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении списка предметов' 
    });
  }
};

// Валидатор предметов (можно использовать в authController)
export const validateSubjects = (subjects: string[], role: string) => {
  if (role === 'teacher' && subjects.length === 0) {
    return 'Преподаватель должен вести хотя бы один предмет';
  }
  
  const invalidSubjects = subjects.filter(
    subject => !AVAILABLE_SUBJECTS.includes(subject)
  );
  
  if (invalidSubjects.length > 0) {
    return `Недопустимые предметы: ${invalidSubjects.join(', ')}`;
  }
  
  return null;
};