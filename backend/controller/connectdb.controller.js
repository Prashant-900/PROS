import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // ⬅️ Load env vars

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(uri);

    console.log('MongoDB connected');
    return conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    throw new Error('Failed to connect to MongoDB');
  }
};

export default connectDB;
