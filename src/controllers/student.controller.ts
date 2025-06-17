import { Request, Response } from 'express';
import Student from '../models/Student';

// Получение всех студентов
export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const students = await Student.find().sort({ name: 1 });
    return res.status(200).json(students);
  } catch (error) {
    console.error('Error getting all students:', error);
    return res.status(500).json({ 
      message: 'Ошибка при получении списка студентов' 
    });
  }
};

// Получение студентов по группе
export const getStudentsByGroup = async (req: Request, res: Response) => {
  try {
    const { group } = req.params;
    const students = await Student.find({ group }).sort({ name: 1 });
    return res.status(200).json(students);
  } catch (error) {
    console.error('Error getting students by group:', error);
    return res.status(500).json({ 
      message: 'Ошибка при получении студентов группы' 
    });
  }
};

// Получение одного студента по ID
export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    
    if (!student) {
      return res.status(404).json({ 
        message: 'Студент не найден' 
      });
    }
    
    return res.status(200).json(student);
  } catch (error) {
    console.error('Error getting student by id:', error);
    return res.status(500).json({ 
      message: 'Ошибка при получении данных студента' 
    });
  }
};

// Создание нового студента
export const createStudent = async (req: Request, res: Response) => {
  try {
    const { name, group } = req.body;
    
    // Простая валидация
    if (!name || !group) {
      return res.status(400).json({ 
        message: 'Необходимо указать имя и группу студента' 
      });
    }
    
    const student = new Student({
      name,
      group
    });
    
    await student.save();
    
    return res.status(201).json({
      message: 'Студент успешно добавлен',
      student
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return res.status(500).json({ 
      message: 'Ошибка при создании студента' 
    });
  }
};

// Обновление данных студента
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, group } = req.body;
    
    // Простая валидация
    if (!name && !group) {
      return res.status(400).json({ 
        message: 'Необходимо предоставить данные для обновления' 
      });
    }
    
    const student = await Student.findByIdAndUpdate(
      id,
      { name, group },
      { new: true, runValidators: true }
    );
    
    if (!student) {
      return res.status(404).json({ 
        message: 'Студент не найден' 
      });
    }
    
    return res.status(200).json({
      message: 'Данные студента обновлены',
      student
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return res.status(500).json({ 
      message: 'Ошибка при обновлении данных студента' 
    });
  }
};

// Удаление студента
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);
    
    if (!student) {
      return res.status(404).json({ 
        message: 'Студент не найден' 
      });
    }
    
    return res.status(200).json({
      message: 'Студент успешно удален'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return res.status(500).json({ 
      message: 'Ошибка при удалении студента' 
    });
  }
}; 