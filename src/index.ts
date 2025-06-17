import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Импорт маршрутов
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import feedbackRoutes from './routes/feedback.routes';
import notificationRoutes from './routes/notification.routes';

// Импорт утилиты инициализации базы данных
import { initializeDatabase } from './utils/dbInit';

// Загрузка переменных окружения
dotenv.config();

// Инициализация Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Асинхронная функция для запуска сервера
const startServer = async () => {
  try {
    // Подключение к базе данных MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feedback-app');
    console.log('Connected to MongoDB');
    
    // Инициализация базы данных
    await initializeDatabase();
    
    // Маршруты API
    app.use('/api/auth', authRoutes);
    app.use('/api/students', studentRoutes);
    app.use('/api/feedback', feedbackRoutes);
    app.use('/api/notifications', notificationRoutes);
    
    // Базовый маршрут
    app.get('/', (_req, res) => {
      res.send('Feedback Application API');
    });
    
    // Обработка ошибок
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error(err.stack);
      res.status(500).json({
        message: 'Что-то пошло не так на сервере!'
      });
    });
    
    // Запуск сервера
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Запуск сервера
startServer(); 