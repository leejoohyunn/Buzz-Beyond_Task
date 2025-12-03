/**
 * GraphQL API 서버 진입점
 * Apollo Server를 사용하여 환율 정보를 관리하는 GraphQL API를 제공합니다.
 */

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { parse } from 'graphql';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './resolvers/index.js';

// 환경변수 로드 (.env 파일)
dotenv.config();

/**
 * 서버 시작 함수
 * MongoDB 연결 후 Apollo GraphQL 서버를 구동합니다.
 */
const startServer = async () => {
  try {
    // MongoDB 연결
    await connectDB();

    // Apollo Federation Subgraph 스키마 생성 (GraphQL 스키마와 리졸버 등록)
    // @key 디렉티브 지원을 위해 buildSubgraphSchema 사용
    const schema = buildSubgraphSchema({
      typeDefs: parse(typeDefs),
      resolvers
    });

    // Apollo Server 생성
    const server = new ApolloServer({
      schema
    });

    // 서버 시작 (포트는 환경변수 또는 기본값 5110)
    const { url } = await startStandaloneServer(server, {
      listen: { port: parseInt(process.env.PORT) || 5110 }
    });

    console.log(`🚀 Server ready at ${url}`);
    console.log(`📊 GraphQL endpoint: ${url}graphql`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// 서버 실행
startServer();
