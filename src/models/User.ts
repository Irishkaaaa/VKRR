import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface UserDocument extends Document {
  username: string;
  password: string;
  email: string;
  role: 'teacher' | 'classTeacher' | 'admin';
  group?: string;
  pushToken?: string | null;
  subjects?: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<UserDocument>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['teacher', 'classTeacher', 'admin'],
    default: 'teacher',
    required: true
  },
  group: {
    type: String
  },
  pushToken: {
    type: String,
    default: null
  },
  subjects: {
    type: [String],
    default: [],
    validate: {
      validator: function(this: UserDocument, subjects: string[]) {
        if (this.role === 'teacher' && subjects.length === 0) {
          return false;
        }
        return true;
      },
      message: 'Преподаватель должен вести хотя бы один предмет'
    }
  }
}, { timestamps: true });

// Хэширование пароля
UserSchema.pre<UserDocument>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Метод сравнения паролей
UserSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password).catch(() => false);
};

export default mongoose.model<UserDocument>('User', UserSchema);