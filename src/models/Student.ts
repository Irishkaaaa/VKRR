import mongoose from 'mongoose';

export interface StudentDocument extends mongoose.Document {
  name: string;
  group: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    group: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Student = mongoose.model<StudentDocument>('Student', StudentSchema);

export default Student; 