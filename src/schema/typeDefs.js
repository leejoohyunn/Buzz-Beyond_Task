/**
 * GraphQL 타입 정의 (Schema)
 * 환율 API의 Query, Mutation, Input, Output 타입을 정의합니다.
 *
 * 주요 기능:
 * - Query: 환율 조회
 * - Mutation: 환율 등록/수정(upsert), 환율 삭제
 */

export const typeDefs = `#graphql
  # 쿼리 타입: 데이터 조회
  type Query {
    "환율조회: 소스 통화와 타겟 통화 간의 환율을 조회합니다"
    getExchangeRate(src: String!, tgt: String!): ExchangeInfo
  }

  # 뮤테이션 타입: 데이터 변경
  type Mutation {
    "환율등록/수정: src, tgt, date 조합으로 upsert 작업을 수행합니다"
    postExchangeRate(info: InputUpdateExchangeInfo): ExchangeInfo
    "환율삭제: 해당 일자의 해당 통화 간 환율을 삭제합니다"
    deleteExchangeRate(info: InputDeleteExchangeInfo): ExchangeInfo
  }

  "환율 업데이트 정보 입력 타입"
  input InputUpdateExchangeInfo {
    "소스통화 (예: krw, usd)"
    src: String!
    "타겟통화 (예: krw, usd)"
    tgt: String!
    "환율 (소스통화 1단위당 타겟통화 가치)"
    rate: Float!
    "기준일 (YYYY-MM-DD), 값이 없으면 현재 날짜로 등록"
    date: String
  }

  "환율 삭제 정보 입력 타입"
  input InputDeleteExchangeInfo {
    "소스통화"
    src: String!
    "타겟통화"
    tgt: String!
    "기준일 (YYYY-MM-DD)"
    date: String!
  }

  "환율 정보 출력 타입"
  type ExchangeInfo {
    "소스통화"
    src: String!
    "타겟통화"
    tgt: String!
    "환율"
    rate: Float!
    "기준일"
    date: String!
  }
`;
