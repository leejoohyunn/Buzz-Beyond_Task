/**
 * GraphQL Resolver 구현
 * GraphQL 쿼리와 뮤테이션의 실제 비즈니스 로직을 처리합니다.
 *
 * 주요 기능:
 * - getExchangeRate: 환율 조회 (역환율 계산 지원)
 * - postExchangeRate: 환율 등록/수정 (upsert)
 * - deleteExchangeRate: 환율 삭제
 */

import ExchangeRate from '../models/ExchangeRate.js';

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환하는 헬퍼 함수
 * @returns {String} 현재 날짜 (예: "2024-12-03")
 */
const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const resolvers = {
  /**
   * Query Resolver
   * 데이터 조회 작업을 처리합니다.
   */
  Query: {
    /**
     * 환율 조회
     * @param {Object} _ - GraphQL parent (사용 안 함)
     * @param {Object} params - { src, tgt } 소스/타겟 통화
     * @returns {Object} ExchangeInfo 환율 정보
     */
    getExchangeRate: async (_, { src, tgt }) => {
      // 통화 코드를 소문자로 정규화
      const normalizedSrc = src.toLowerCase();
      const normalizedTgt = tgt.toLowerCase();

      // 같은 통화간 환율은 항상 1 (예: KRW -> KRW)
      if (normalizedSrc === normalizedTgt) {
        return {
          src: normalizedSrc,
          tgt: normalizedTgt,
          rate: 1,
          date: getCurrentDate()
        };
      }

      // DB에서 최신 환율 조회 (date 기준 내림차순)
      let exchangeRate = await ExchangeRate.findOne({
        src: normalizedSrc,
        tgt: normalizedTgt
      }).sort({ date: -1 });

      // 직접 환율이 없으면 역환율을 조회 (tgt->src)
      // 예: USD->KRW가 없으면 KRW->USD의 역수를 계산
      if (!exchangeRate) {
        const reverseRate = await ExchangeRate.findOne({
          src: normalizedTgt,
          tgt: normalizedSrc
        }).sort({ date: -1 });

        if (!reverseRate) {
          throw new Error(`Exchange rate not found for ${src} to ${tgt}`);
        }

        // 역환율 계산: 1 / rate
        // 예: KRW->USD가 0.00075라면, USD->KRW는 1/0.00075 = 1333.33
        return {
          src: normalizedSrc,
          tgt: normalizedTgt,
          rate: 1 / reverseRate.rate,
          date: reverseRate.date
        };
      }

      // 정상적으로 찾은 환율 반환
      return {
        src: exchangeRate.src,
        tgt: exchangeRate.tgt,
        rate: exchangeRate.rate,
        date: exchangeRate.date
      };
    }
  },

  /**
   * Mutation Resolver
   * 데이터 변경 작업을 처리합니다.
   */
  Mutation: {
    /**
     * 환율 등록/수정 (Upsert)
     * @param {Object} _ - GraphQL parent (사용 안 함)
     * @param {Object} params - { info } 환율 정보 (src, tgt, rate, date)
     * @returns {Object} ExchangeInfo 저장된 환율 정보
     */
    postExchangeRate: async (_, { info }) => {
      const { src, tgt, rate, date } = info;
      // 통화 코드를 소문자로 정규화
      const normalizedSrc = src.toLowerCase();
      const normalizedTgt = tgt.toLowerCase();
      // date가 없으면 현재 날짜 사용
      const finalDate = date || getCurrentDate();

      // 같은 통화간 환율은 항상 1로 고정
      const finalRate = normalizedSrc === normalizedTgt ? 1 : rate;

      // upsert: src, tgt, date 조합으로 찾아서 있으면 업데이트, 없으면 생성
      const exchangeRate = await ExchangeRate.findOneAndUpdate(
        {
          src: normalizedSrc,
          tgt: normalizedTgt,
          date: finalDate
        },
        {
          src: normalizedSrc,
          tgt: normalizedTgt,
          rate: finalRate,
          date: finalDate
        },
        {
          upsert: true,  // 없으면 생성
          new: true       // 업데이트된 문서 반환
        }
      );

      return {
        src: exchangeRate.src,
        tgt: exchangeRate.tgt,
        rate: exchangeRate.rate,
        date: exchangeRate.date
      };
    },

    /**
     * 환율 삭제
     * @param {Object} _ - GraphQL parent (사용 안 함)
     * @param {Object} params - { info } 삭제할 환율 정보 (src, tgt, date)
     * @returns {Object} ExchangeInfo 삭제된 환율 정보
     */
    deleteExchangeRate: async (_, { info }) => {
      const { src, tgt, date } = info;
      // 통화 코드를 소문자로 정규화
      const normalizedSrc = src.toLowerCase();
      const normalizedTgt = tgt.toLowerCase();

      // 같은 통화간 환율 삭제 시 rate=1로 반환 (실제로는 DB에 저장하지 않음)
      if (normalizedSrc === normalizedTgt) {
        return {
          src: normalizedSrc,
          tgt: normalizedTgt,
          rate: 1,
          date: date
        };
      }

      // DB에서 해당 환율 삭제
      const exchangeRate = await ExchangeRate.findOneAndDelete({
        src: normalizedSrc,
        tgt: normalizedTgt,
        date: date
      });

      // 해당 환율이 없는 경우 에러
      if (!exchangeRate) {
        throw new Error(`Exchange rate not found for ${src} to ${tgt} on ${date}`);
      }

      // 삭제된 환율 정보 반환
      return {
        src: exchangeRate.src,
        tgt: exchangeRate.tgt,
        rate: exchangeRate.rate,
        date: exchangeRate.date
      };
    }
  }
};
