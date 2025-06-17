import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Интерфейс для тела запроса регистрации
interface RegisterBody {
  username: string;
  email: string;
  password: string;
  role: 'teacher' | 'classTeacher' | 'admin';
  group?: string;
  subjects?: string[];
}

// Генерация JWT токена
const generateToken = (userId: string, role: string) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'your-strong-secret-key-here',
    { expiresIn: '30d' }
  );
};

export const register = async (req: Request<{}, {}, RegisterBody>, res: Response) => {
  try {
    const { username, email, password, role, group, subjects = [] } = req.body;

    // Проверка обязательных полей
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: 'Все обязательные поля должны быть заполнены' });
    }

    // Проверка существования пользователя
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'Пользователь с таким email или именем уже существует' 
      });
    }

    // Валидация ролей
    if (role === 'classTeacher' && !group) {
      return res.status(400).json({ 
        message: 'Для классного руководителя необходимо указать группу' 
      });
    }

    if (role === 'teacher' && (!subjects || subjects.length === 0)) {
      return res.status(400).json({ 
        message: 'Преподаватель должен вести хотя бы один предмет' 
      });
    }

    // Создание пользователя
    const user = new User({
      username,
      email,
      password,
      role,
      ...(role === 'classTeacher' && { group }),
      ...(role === 'teacher' && { subjects })
    });

    await user.save();

    // Генерация токена
    const token = generateToken(user.id.toString(), user.role);

    // Формирование ответа
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      group: user.group,
      subjects: user.subjects,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token, // Добавляем токен в ответ
      user: userResponse
    });

  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    return res.status(500).json({ 
      message: 'Произошла ошибка при регистрации',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        message: 'Имя пользователя и пароль обязательны' 
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        message: 'Неверные учетные данные' 
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Неверные учетные данные' 
      });
    }

    // Генерация токена
    const token = generateToken(user.id.toString(), user.role);

    // Формирование ответа
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      group: user.group,
      subjects: user.subjects,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return res.status(200).json({
      message: 'Вход выполнен успешно',
      token, // Добавляем токен в ответ
      user: userResponse
    });

  } catch (error) {
    console.error('Ошибка при входе:', error);
    return res.status(500).json({ 
      message: 'Произошла ошибка при входе',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};