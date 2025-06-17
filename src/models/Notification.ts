import mongoose from 'mongoose';

export interface NotificationDocument extends mongoose.Document {
  userId: string;
  title: string;
  body: string;
  type: string;
  data: any;
  read: boolean;
  date?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['NEW_FEEDBACK', 'PARENT_MEETING', 'REPORT_DUE', 'SYSTEM', 'OTHER'],
      default: 'SYSTEM',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model<NotificationDocument>('Notification', NotificationSchema);

export default Notification; 