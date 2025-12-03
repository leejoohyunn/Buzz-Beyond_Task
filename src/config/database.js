/**
 * MongoDB 데이터베이스 연결 설정
 * Mongoose를 사용하여 MongoDB와 연결하고 연결 상태를 모니터링합니다.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

/**
 * MongoDB 연결 함수
 * 환경변수의 MONGODB_URI를 사용하여 데이터베이스에 연결합니다.
 * 연결 실패 시 프로세스를 종료합니다.
 */
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// MongoDB 연결이 끊어졌을 때 이벤트 리스너
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// MongoDB 연결 중 에러 발생 시 이벤트 리스너
mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});
