/**
 * 환율 정보 MongoDB 모델
 * 통화 간 환율 데이터를 저장하는 Mongoose 스키마 및 모델을 정의합니다.
 */

import mongoose from 'mongoose';

/**
 * 환율 스키마 정의
 * @property {String} src - 소스 통화 (예: usd, krw)
 * @property {String} tgt - 타겟 통화 (예: usd, krw)
 * @property {Number} rate - 환율 (src 1단위당 tgt 가치)
 * @property {String} date - 기준일 (YYYY-MM-DD 형식)
 * @property {Date} createdAt - 생성 시간 (자동 생성)
 * @property {Date} updatedAt - 수정 시간 (자동 생성)
 */
const exchangeRateSchema = new mongoose.Schema({
  src: {
    type: String,
    required: true,
    lowercase: true,  // 자동으로 소문자 변환
    trim: true        // 앞뒤 공백 제거
  },
  tgt: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  rate: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  }
}, {
  timestamps: true    // createdAt, updatedAt 필드 자동 생성
});

// src, tgt, date 조합으로 unique index 생성 (upsert 지원)
// 같은 날짜에 같은 통화 쌍의 환율은 하나만 존재
exchangeRateSchema.index({ src: 1, tgt: 1, date: 1 }, { unique: true });

// Mongoose 모델 생성 (컬렉션 이름: exchangerates)
const ExchangeRate = mongoose.model('ExchangeRate', exchangeRateSchema);

export default ExchangeRate;
