# Exchange Rate API 개발 과정 문서

> 원화(KRW)와 미화(USD) 환율 정보를 관리하는 GraphQL API 서버 구현 과정

---

## 1. 프로젝트 개요

### 1.1 프로젝트 목표

환율 정보를 **CRUD(Create, Read, Update, Delete)** 할 수 있는 GraphQL API 서버를 구축하여, RESTful API와 다른 현대적인 API 설계 방식을 학습하고 실무에 적용 가능한 백엔드 시스템을 구현한다.

### 1.2 요구사항

- **환율 조회**: 특정 통화 쌍의 최신 환율 정보 조회
- **환율 등록/수정**: 새로운 환율 등록 또는 기존 환율 업데이트 (Upsert)
- **환율 삭제**: 특정 날짜의 환율 정보 삭제
- **데이터 저장**: MongoDB를 사용한 영구 저장
- **실행 가능성**: Git clone 후 바로 실행 가능한 구조

### 1.3 프로젝트 구조

```
exchange-rate-api/
├── src/
│   ├── config/
│   │   └── database.js       # MongoDB 연결 설정
│   ├── models/
│   │   └── ExchangeRate.js   # Mongoose 스키마 및 모델
│   ├── resolvers/
│   │   └── index.js          # GraphQL Resolver 로직
│   ├── schema/
│   │   └── typeDefs.js       # GraphQL 타입 정의
│   └── index.js              # 서버 진입점
├── .env                      # 환경변수 (gitignore)
├── .env.example              # 환경변수 예시
├── .gitignore
├── package.json
└── README.md
```

---

## 2. 기술 스택 

### 2.1 GraphQL


1. **유연한 데이터 요청**
   ```graphql
   # REST: /api/exchange-rate?src=usd&tgt=krw (모든 필드 반환)
   # GraphQL: 필요한 필드만 선택 가능
   query {
     getExchangeRate(src: "usd", tgt: "krw") {
       rate  # date는 필요 없으면 안 받음
     }
   }
   ```

2. **단일 엔드포인트**
   - REST: 여러 엔드포인트 필요 (GET /rates, POST /rates, DELETE /rates)
   - GraphQL: `/graphql` 하나로 모든 작업 처리

3. **타입 안정성**
   - Schema 정의로 입출력 타입 명확
   - 자동 문서화 (Apollo Sandbox)


### 2.2 MongoDB

**관계형 DB(MySQL, PostgreSQL) 대신 MongoDB 사용:**

1. **유연한 스키마**
   - JSON 형태로 저장하여 GraphQL과 자연스럽게 연동

2. **빠른 개발**
   - 복잡한 테이블 관계 설정 불필요
   - Mongoose로 간단한 스키마 정의

3. **확장성**
   - 추후 다른 통화 추가, 메타데이터 추가 등 유연하게 대응

4. **학습 곡선**
   - 초반 학습이 상대적으로 쉬움
   - JavaScript 객체와 유사한 구조

### 2.3 Apollo Server

**직접 GraphQL 서버 구축 대신 Apollo Server 사용:**

1. **개발 생산성**
   - 복잡한 설정 없이 빠른 서버 구축
   - Built-in Playground (테스트 UI 제공)

2. **에러 핸들링**
   - 자동 에러 처리 및 포맷팅
   - 개발 환경에서 상세한 에러 메시지

3. **커뮤니티**
   - 풍부한 문서와 예제
   - 활발한 생태계 (플러그인, 도구)

---

## 3. 학습한 핵심 개념

### 3.1 Node.js 기초

#### 모듈 시스템 (ES Modules)

```javascript
// package.json에서 "type": "module" 설정
import { ApolloServer } from '@apollo/server';  // ES6 import
export const connectDB = async () => { ... };    // ES6 export
```

**학습 포인트:**
- CommonJS(`require`) vs ES Modules(`import/export`)
- `package.json`의 `"type": "module"` 설정 필요
- 파일 확장자 `.js` 명시 필요

#### 비동기 프로그래밍

```javascript
// async/await 패턴
const startServer = async () => {
  await connectDB();           // MongoDB 연결 대기
  const server = new ApolloServer({ schema });
  await startStandaloneServer(server);  // 서버 시작 대기
};
```

**학습 포인트:**
- `async/await`로 비동기 코드를 동기처럼 작성
- `Promise` 이해
- 에러 핸들링 (`try/catch`)

### 3.2 GraphQL 핵심 개념

#### Schema Definition Language (SDL)

```graphql
# 타입 정의
type ExchangeInfo {
  src: String!   # ! = 필수 필드
  tgt: String!
  rate: Float!
  date: String!
}

# 쿼리 정의 (읽기)
type Query {
  getExchangeRate(src: String!, tgt: String!): ExchangeInfo
}

# 뮤테이션 정의 (쓰기)
type Mutation {
  postExchangeRate(info: InputUpdateExchangeInfo): ExchangeInfo
}
```

**학습 포인트:**
- `type`: 반환 타입 정의
- `input`: 입력 전용 타입 (mutation에서 사용)
- `Query`: 데이터 조회 (GET과 유사)
- `Mutation`: 데이터 변경 (POST/PUT/DELETE와 유사)
- `!`: Non-nullable 표시

#### Resolver 패턴

```javascript
export const resolvers = {
  Query: {
    // Query.getExchangeRate에 대응
    getExchangeRate: async (parent, args, context, info) => {
      // args = { src: "usd", tgt: "krw" }
      // 실제 비즈니스 로직
    }
  },
  Mutation: {
    // Mutation.postExchangeRate에 대응
    postExchangeRate: async (parent, args, context, info) => {
      // args = { info: { src, tgt, rate, date } }
    }
  }
};
```

**학습 포인트:**
- Resolver는 Schema의 각 필드에 대응하는 함수
- 4개의 매개변수: `(parent, args, context, info)`
- `args`: 클라이언트가 보낸 인자
- 실제 데이터베이스 로직은 여기서 처리

### 3.3 MongoDB & Mongoose

#### 스키마 정의

```javascript
const exchangeRateSchema = new mongoose.Schema({
  src: {
    type: String,
    required: true,
    lowercase: true,   // 자동 소문자 변환
    trim: true         // 공백 제거
  },
  rate: {
    type: Number,
    required: true
  }
}, {
  timestamps: true     // createdAt, updatedAt 자동 생성
});

// 복합 인덱스 (중복 방지)
exchangeRateSchema.index({ src: 1, tgt: 1, date: 1 }, { unique: true });
```

**학습 포인트:**
- Mongoose 스키마 = 데이터 구조 정의 + 유효성 검사
- 인덱스로 조회 성능 향상 및 중복 방지
- `timestamps` 옵션으로 자동 시간 기록

#### CRUD 작업

```javascript
// CREATE / UPDATE (Upsert)
await ExchangeRate.findOneAndUpdate(
  { src: "usd", tgt: "krw", date: "2024-12-03" },  // 조건
  { rate: 1342.11 },                               // 업데이트 내용
  { upsert: true, new: true }                      // 옵션
);

// READ
await ExchangeRate.findOne({ src: "usd", tgt: "krw" })
  .sort({ date: -1 });  // 날짜 내림차순

// DELETE
await ExchangeRate.findOneAndDelete({ src: "usd", tgt: "krw", date: "2024-12-03" });
```

**학습 포인트:**
- `findOneAndUpdate` + `upsert: true` = 없으면 생성, 있으면 수정
- `sort({ date: -1 })` = 최신 데이터 먼저
- `findOneAndDelete` = 찾아서 삭제 + 삭제된 데이터 반환

### 3.4 환경변수 관리 (dotenv)

```javascript
// .env 파일
MONGODB_URI=mongodb://localhost:27017/exchange-rate-db
PORT=5110

// 코드에서 사용
import dotenv from 'dotenv';
dotenv.config();

const dbUri = process.env.MONGODB_URI;  // 환경변수 읽기
```

**학습 포인트:**
- `.env` 파일로 민감한 정보 분리
- `.gitignore`에 `.env` 추가 (보안)
- `.env.example`로 예시 제공

---

## 4. 구현 과정

### Phase 1: 프로젝트 초기 설정

#### 1. 프로젝트 생성 및 의존성 설치

```bash
# 프로젝트 디렉토리 생성
mkdir exchange-rate-api
cd exchange-rate-api

# package.json 생성
npm init -y

# 의존성 설치
npm install @apollo/server @apollo/subgraph graphql mongoose dotenv
```

#### 2. package.json 설정

```json
{
  "type": "module",  // ES Modules 사용
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js"  // 파일 변경 시 자동 재시작
  }
}
```

**학습한 점:**
- `"type": "module"` 설정으로 ES6 import/export 사용 가능
- `--watch` 플래그로 개발 생산성 향상

#### 3. 환경변수 설정

```bash
# .env 파일 생성
MONGODB_URI=mongodb://localhost:27017/exchange-rate-db
PORT=5110

# .gitignore에 추가
echo ".env" >> .gitignore
echo "node_modules/" >> .gitignore
```

---

### Phase 2: MongoDB 연결 설정

#### 파일: `src/config/database.js`

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);  // 실패 시 프로세스 종료
  }
};

// 연결 상태 모니터링
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});
```

**구현 포인트:**
- 환경변수에서 DB URI 읽기
- 연결 실패 시 명확한 에러 메시지 출력
- 연결 상태 이벤트 리스너 등록

**테스트 방법:**
```bash
# MongoDB 실행 확인
mongosh  # MongoDB Shell 접속 시도

# 서버 실행 시 "MongoDB connected successfully" 출력 확인
```

---

### Phase 3: 데이터 모델 정의

#### 파일: `src/models/ExchangeRate.js`

```javascript
import mongoose from 'mongoose';

const exchangeRateSchema = new mongoose.Schema({
  src: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
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
  timestamps: true
});

// Unique Index: 같은 날짜에 같은 통화쌍은 하나만
exchangeRateSchema.index({ src: 1, tgt: 1, date: 1 }, { unique: true });

const ExchangeRate = mongoose.model('ExchangeRate', exchangeRateSchema);

export default ExchangeRate;
```

**구현 포인트:**
- `lowercase: true`로 대소문자 통일 (USD, usd → usd)
- `trim: true`로 공백 제거
- 복합 unique 인덱스로 중복 방지
- `timestamps: true`로 생성/수정 시간 자동 기록

**학습한 점:**
- MongoDB는 컬렉션 이름을 자동으로 복수형으로 변환 (`ExchangeRate` → `exchangerates`)
- 인덱스는 성능과 데이터 무결성 모두에 중요

---

### Phase 4: GraphQL Schema 정의

#### 파일: `src/schema/typeDefs.js`

```javascript
export const typeDefs = `#graphql
  type Query {
    "환율조회"
    getExchangeRate(src:String!, tgt:String!): ExchangeInfo
  }

  type Mutation {
    "환율등록, src, tgt, date에 대해서 upsert"
    postExchangeRate(info: InputUpdateExchangeInfo): ExchangeInfo
    "환율삭제, 해당일자의 해당 통화간 환율을 삭제"
    deleteExchangeRate(info: InputDeleteExchangeInfo): ExchangeInfo
  }

  input InputUpdateExchangeInfo {
    src: String!
    tgt: String!
    rate: Float!
    date: String
  }

  input InputDeleteExchangeInfo {
    src: String!
    tgt: String!
    date: String!
  }

  type ExchangeInfo @key(fields: "src, tgt") {
    src: String!
    tgt: String!
    rate: Float!
    date: String!
  }
`;
```

**구현 포인트:**
- `input` 타입으로 입력 데이터 구조화
- `@key` 디렉티브로 Apollo Federation 지원 (향후 마이크로서비스 확장 가능)
- 한글 주석으로 GraphQL Playground에서 가독성 향상

**학습한 점:**
- `type`과 `input`의 차이: `input`은 mutation 인자로만 사용 가능
- `Float` vs `Int`: 환율은 소수점이 필요하므로 `Float` 사용

---

### Phase 5: Resolver 구현

#### 파일: `src/resolvers/index.js`

**핵심 로직 설명:**

##### 1. 환율 조회 (getExchangeRate)

```javascript
getExchangeRate: async (_, { src, tgt }) => {
  const normalizedSrc = src.toLowerCase();
  const normalizedTgt = tgt.toLowerCase();

  // Case 1: 같은 통화 (KRW → KRW)
  if (normalizedSrc === normalizedTgt) {
    return { src: normalizedSrc, tgt: normalizedTgt, rate: 1, date: getCurrentDate() };
  }

  // Case 2: 직접 환율 조회 (USD → KRW)
  let exchangeRate = await ExchangeRate.findOne({
    src: normalizedSrc,
    tgt: normalizedTgt
  }).sort({ date: -1 });

  if (exchangeRate) {
    return exchangeRate;
  }

  // Case 3: 역환율 조회 (KRW → USD의 역수)
  const reverseRate = await ExchangeRate.findOne({
    src: normalizedTgt,
    tgt: normalizedSrc
  }).sort({ date: -1 });

  if (!reverseRate) {
    throw new Error(`Exchange rate not found for ${src} to ${tgt}`);
  }

  return {
    src: normalizedSrc,
    tgt: normalizedTgt,
    rate: 1 / reverseRate.rate,  // 역수 계산
    date: reverseRate.date
  };
}
```

**구현 포인트:**
- 3가지 케이스 처리: 같은 통화, 직접 환율, 역환율
- 역환율 계산으로 데이터 중복 최소화 (USD→KRW만 저장하면 KRW→USD 자동 계산)
- `sort({ date: -1 })`로 최신 데이터 우선

**학습한 점:**
- 역환율 계산: KRW→USD = 0.00075 ⇒ USD→KRW = 1/0.00075 = 1333.33
- `findOne`은 하나만 반환, `find`는 배열 반환

##### 2. 환율 등록/수정 (postExchangeRate)

```javascript
postExchangeRate: async (_, { info }) => {
  const { src, tgt, rate, date } = info;
  const normalizedSrc = src.toLowerCase();
  const normalizedTgt = tgt.toLowerCase();
  const finalDate = date || getCurrentDate();  // date 없으면 오늘
  const finalRate = normalizedSrc === normalizedTgt ? 1 : rate;

  // Upsert: 있으면 업데이트, 없으면 생성
  const exchangeRate = await ExchangeRate.findOneAndUpdate(
    { src: normalizedSrc, tgt: normalizedTgt, date: finalDate },
    { src: normalizedSrc, tgt: normalizedTgt, rate: finalRate, date: finalDate },
    { upsert: true, new: true }
  );

  return exchangeRate;
}
```

**구현 포인트:**
- `findOneAndUpdate` + `upsert: true`로 INSERT/UPDATE 한 번에 처리
- `new: true` 옵션으로 업데이트된 문서 반환 (false면 업데이트 전 문서 반환)
- 같은 통화는 무조건 `rate = 1`로 강제

**학습한 점:**
- Upsert = Update + Insert (있으면 수정, 없으면 삽입)
- MongoDB의 unique index와 upsert 조합 시 동시성 안전

##### 3. 환율 삭제 (deleteExchangeRate)

```javascript
deleteExchangeRate: async (_, { info }) => {
  const { src, tgt, date } = info;
  const normalizedSrc = src.toLowerCase();
  const normalizedTgt = tgt.toLowerCase();

  // 같은 통화는 DB에서 삭제하지 않고 rate=1 반환
  if (normalizedSrc === normalizedTgt) {
    return { src: normalizedSrc, tgt: normalizedTgt, rate: 1, date: date };
  }

  const exchangeRate = await ExchangeRate.findOneAndDelete({
    src: normalizedSrc,
    tgt: normalizedTgt,
    date: date
  });

  if (!exchangeRate) {
    throw new Error(`Exchange rate not found for ${src} to ${tgt} on ${date}`);
  }

  return exchangeRate;
}
```

**구현 포인트:**
- `findOneAndDelete`는 삭제 전 문서를 반환 (삭제 확인용)
- 없는 데이터 삭제 시 명확한 에러 메시지

---

### Phase 6: 서버 구성

#### 파일: `src/index.js`

```javascript
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { parse } from 'graphql';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './resolvers/index.js';

dotenv.config();

const startServer = async () => {
  try {
    // 1. MongoDB 연결
    await connectDB();

    // 2. Subgraph 스키마 생성 (@key 디렉티브 지원)
    const schema = buildSubgraphSchema({
      typeDefs: parse(typeDefs),
      resolvers
    });

    // 3. Apollo Server 인스턴스 생성
    const server = new ApolloServer({ schema });

    // 4. 서버 시작
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

startServer();
```

**구현 포인트:**
- `buildSubgraphSchema` 사용으로 Apollo Federation 지원
- `parse(typeDefs)`로 문자열을 GraphQL AST로 변환
- 에러 발생 시 프로세스 종료 (무한 재시작 방지)

**학습한 점:**
- Apollo Server v4부터 `startStandaloneServer` 사용 (이전 버전과 문법 다름)
- `@apollo/subgraph` 패키지로 Federation 준비 (마이크로서비스 아키텍처 대비)

---

## 5. 주요 코드 설명

### 5.1 역환율 계산 로직

**문제 상황:**
- DB에 `USD → KRW = 1342.11` 만 저장되어 있음
- 사용자가 `KRW → USD` 조회 요청

**해결 방법:**
```javascript
// USD → KRW가 없으면, KRW → USD 찾기
const reverseRate = await ExchangeRate.findOne({
  src: normalizedTgt,  // 원래 tgt를 src로
  tgt: normalizedSrc   // 원래 src를 tgt로
}).sort({ date: -1 });

// 역수 계산
return {
  rate: 1 / reverseRate.rate  // 1 / 1342.11 = 0.000745
};
```

**수학적 원리:**
```
USD → KRW = 1342.11
⇒ 1 USD = 1342.11 KRW
⇒ 1 KRW = 1/1342.11 USD = 0.000745 USD
⇒ KRW → USD = 0.000745
```

**장점:**
- 데이터 저장 공간 50% 절약 (양방향 모두 저장 불필요)
- 데이터 일관성 보장 (하나만 업데이트하면 양방향 모두 반영)

---

### 5.2 Upsert 패턴

**문제 상황:**
- 같은 날짜에 같은 통화쌍의 환율이 이미 있으면 업데이트
- 없으면 새로 생성

**일반적인 방법 (비효율적):**
```javascript
// 1. 먼저 조회
const existing = await ExchangeRate.findOne({ src, tgt, date });

// 2. 있으면 업데이트
if (existing) {
  existing.rate = rate;
  await existing.save();
} else {
  // 3. 없으면 생성
  await ExchangeRate.create({ src, tgt, rate, date });
}
```
→ **2번의 DB 작업** (비효율, 동시성 문제)

**Upsert 방법 (효율적):**
```javascript
const exchangeRate = await ExchangeRate.findOneAndUpdate(
  { src, tgt, date },      // 조건
  { src, tgt, rate, date }, // 업데이트 내용
  { upsert: true, new: true }  // 옵션
);
```
→ **1번의 DB 작업** (효율적, 동시성 안전)

**장점:**
- 성능 향상 (1번의 작업)
- 동시성 문제 해결 (Atomic 연산)
- 코드 간결화

---

### 5.3 데이터 정규화

**문제 상황:**
- 사용자가 `USD`, `usd`, `Usd` 등 다양하게 입력

**해결 방법:**
```javascript
const normalizedSrc = src.toLowerCase();  // 모두 소문자로
const normalizedTgt = tgt.toLowerCase();
```

**Mongoose 스키마에서도 처리:**
```javascript
src: {
  type: String,
  lowercase: true,  // DB 저장 시 자동 변환
  trim: true        // 공백 제거
}
```

**장점:**
- 데이터 일관성 (모두 소문자로 통일)
- 조회 시 대소문자 구분 없음
- DB 인덱스 효율성 향상

---

### 5.4 현재 날짜 헬퍼 함수

```javascript
const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];  // "2024-12-03"
};
```

**작동 방식:**
```javascript
new Date()                    // 2024-12-03T15:30:45.123Z
  .toISOString()              // "2024-12-03T15:30:45.123Z"
  .split('T')                 // ["2024-12-03", "15:30:45.123Z"]
  [0]                         // "2024-12-03"
```

**사용처:**
- `postExchangeRate`에서 date 생략 시 기본값
- `getExchangeRate`에서 같은 통화 조회 시 현재 날짜 반환

---

## 6. 마주한 문제와 해결 방법

### 문제 1: ES Modules 사용 시 에러

**증상:**
```
SyntaxError: Cannot use import statement outside a module
```

**원인:**
- Node.js는 기본적으로 CommonJS 사용
- `import/export` 사용하려면 ES Modules 활성화 필요

**해결:**
```json
// package.json
{
  "type": "module"  // 추가
}
```

**학습한 점:**
- `"type": "module"` 설정 필수
- 파일 확장자 `.js` 명시 필요 (`import './config/database.js'`)

---

### 문제 2: MongoDB 연결 에러

**증상:**
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**원인:**
- MongoDB 서버가 실행되지 않음

**해결:**
```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**추가 확인:**
```bash
# MongoDB 실행 여부 확인
mongosh
```

**학습한 점:**
- MongoDB는 별도 프로세스로 실행되어야 함
- `localhost:27017`이 기본 포트

---

### 문제 3: Apollo Server 버전 차이

**증상:**
```
apollo-server의 ApolloServer 사용 시 deprecated 경고
```

**원인:**
- Apollo Server v3와 v4의 사용법이 다름
- `apollo-server` 패키지는 deprecated

**해결:**
```javascript
// 기존 (v3)
import { ApolloServer } from 'apollo-server';
const server = new ApolloServer({ typeDefs, resolvers });
await server.listen({ port: 5110 });

// 변경 (v4)
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
const server = new ApolloServer({ schema });
await startStandaloneServer(server, { listen: { port: 5110 } });
```

**학습한 점:**
- 최신 문서 확인의 중요성
- Breaking changes 확인

---

### 문제 4: @key 디렉티브 인식 안 됨

**증상:**
```
Unknown directive "@key"
```

**원인:**
- `@key`는 Apollo Federation 전용 디렉티브
- 일반 Apollo Server는 인식 못함

**해결:**
```bash
# @apollo/subgraph 설치
npm install @apollo/subgraph
```

```javascript
// buildSubgraphSchema 사용
import { buildSubgraphSchema } from '@apollo/subgraph';
import { parse } from 'graphql';

const schema = buildSubgraphSchema({
  typeDefs: parse(typeDefs),
  resolvers
});
```

**학습한 점:**
- Apollo Federation vs 일반 Apollo Server 차이
- `buildSubgraphSchema`로 Federation 디렉티브 지원

---

### 문제 5: 환경변수 파일 Git에 업로드됨

**증상:**
- `.env` 파일이 GitHub에 올라감
- 민감한 정보 노출

**해결:**
```bash
# .gitignore에 추가
echo ".env" >> .gitignore

# 이미 커밋된 경우 Git 캐시에서 제거
git rm --cached .env
git commit -m "Remove .env from repository"
```

```bash
# .env.example 생성 (예시용)
cp .env .env.example
# .env.example의 값들은 더미 데이터로 변경
```

**학습한 점:**
- `.gitignore` 작성의 중요성
- `.env.example`로 설정 가이드 제공

---

## 7. API 테스트 및 검증

### 7.1 Apollo Sandbox 사용

**접속 방법:**
```
http://localhost:5110/graphql
```

브라우저에서 위 URL 접속 시 Apollo Sandbox 자동 실행

---

### 7.2 환율 등록 테스트

**Query:**
```graphql
mutation {
  postExchangeRate(info: {
    src: "usd"
    tgt: "krw"
    rate: 1342.11
    date: "2024-12-03"
  }) {
    src
    tgt
    rate
    date
  }
}
```

**Response:**
```json
{
  "data": {
    "postExchangeRate": {
      "src": "usd",
      "tgt": "krw",
      "rate": 1342.11,
      "date": "2024-12-03"
    }
  }
}
```

---

### 7.3 환율 조회 테스트 (직접)

**Query:**
```graphql
query {
  getExchangeRate(src: "usd", tgt: "krw") {
    src
    tgt
    rate
    date
  }
}
```

**Response:**
```json
{
  "data": {
    "getExchangeRate": {
      "src": "usd",
      "tgt": "krw",
      "rate": 1342.11,
      "date": "2024-12-03"
    }
  }
}
```

---

### 7.4 환율 조회 테스트 (역환율)

**Query:**
```graphql
query {
  getExchangeRate(src: "krw", tgt: "usd") {
    src
    tgt
    rate
    date
  }
}
```

**Response:**
```json
{
  "data": {
    "getExchangeRate": {
      "src": "krw",
      "tgt": "usd",
      "rate": 0.000745,
      "date": "2024-12-03"
    }
  }
}
```

**검증:**
```
1 / 1342.11 = 0.000745 ✓
```

---

### 7.5 같은 통화 조회 테스트

**Query:**
```graphql
query {
  getExchangeRate(src: "krw", tgt: "krw") {
    src
    tgt
    rate
    date
  }
}
```

**Response:**
```json
{
  "data": {
    "getExchangeRate": {
      "src": "krw",
      "tgt": "krw",
      "rate": 1,
      "date": "2024-12-03"
    }
  }
}
```

---

### 7.6 환율 업데이트 테스트 (Upsert)

**Query:**
```graphql
mutation {
  postExchangeRate(info: {
    src: "usd"
    tgt: "krw"
    rate: 1350.50
    date: "2024-12-03"
  }) {
    src
    tgt
    rate
    date
  }
}
```

**Response:**
```json
{
  "data": {
    "postExchangeRate": {
      "src": "usd",
      "tgt": "krw",
      "rate": 1350.50,
      "date": "2024-12-03"
    }
  }
}
```

**DB 확인:**
```bash
mongosh
use exchange-rate-db
db.exchangerates.find({ src: "usd", tgt: "krw", date: "2024-12-03" })
```

**결과:**
```json
{
  "_id": ObjectId("..."),
  "src": "usd",
  "tgt": "krw",
  "rate": 1350.50,  // 업데이트됨
  "date": "2024-12-03",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")  // 업데이트 시간 변경
}
```

---

### 7.7 환율 삭제 테스트

**Query:**
```graphql
mutation {
  deleteExchangeRate(info: {
    src: "usd"
    tgt: "krw"
    date: "2024-12-03"
  }) {
    src
    tgt
    rate
    date
  }
}
```

**Response:**
```json
{
  "data": {
    "deleteExchangeRate": {
      "src": "usd",
      "tgt": "krw",
      "rate": 1350.50,
      "date": "2024-12-03"
    }
  }
}
```

**DB 확인:**
```bash
db.exchangerates.find({ src: "usd", tgt: "krw", date: "2024-12-03" })
# 결과 없음 (삭제됨)
```

---

### 7.8 curl 테스트

**환율 조회:**
```bash
curl -XPOST "http://localhost:5110/graphql" \
-H "Content-Type: application/json" \
-d '{
  "query": "query { getExchangeRate(src: \"usd\", tgt: \"krw\") { rate date } }"
}'
```

**환율 등록:**
```bash
curl -XPOST "http://localhost:5110/graphql" \
-H "Content-Type: application/json" \
-d '{
  "query": "mutation { postExchangeRate(info: { src: \"usd\", tgt: \"krw\", rate: 1342.11, date: \"2024-12-03\" }) { src tgt rate date } }"
}'
```

---

## 8. 배운 점과 느낀 점

### 8.1 기술적 학습

#### GraphQL의 강력함
- **유연성**: 필요한 필드만 선택적으로 요청 가능
- **타입 안정성**: Schema로 명확한 계약 정의
- **개발 경험**: Apollo Sandbox로 즉시 테스트 가능
- **자동 문서화**: Schema 자체가 문서 역할

**REST와 비교:**
```
REST: GET /exchange-rate?src=usd&tgt=krw
→ 모든 필드 반환 (낭비)

GraphQL: query { getExchangeRate(...) { rate } }
→ rate만 반환 (효율)
```

#### MongoDB의 유연성
- **스키마리스**: 필드 추가/삭제가 자유로움
- **JSON 형태**: JavaScript와 자연스럽게 통합
- **인덱스**: 성능과 데이터 무결성 동시 해결
- **Mongoose ODM**: JavaScript 객체로 편리하게 조작

#### 비동기 프로그래밍 이해
- `async/await`로 가독성 높은 코드 작성
- Promise 체이닝 이해
- 에러 핸들링의 중요성 (`try/catch`)

---

### 8.2 설계 패턴 학습

#### Upsert 패턴
- INSERT/UPDATE 로직을 하나로 통합
- 성능 향상 및 코드 간결화
- 동시성 문제 해결

#### 역환율 계산 패턴
- 데이터 중복 최소화
- 비즈니스 로직으로 데이터 보완
- 저장 공간 절약

#### 환경변수 분리 패턴
- 코드와 설정 분리
- 보안 강화 (.env → .gitignore)
- 환경별 설정 관리 용이

---

### 8.3 개발 프로세스 이해

#### 점진적 개발
1. 프로젝트 설정 → 2. DB 연결 → 3. 모델 정의 → 4. Schema 정의 → 5. Resolver 구현 → 6. 서버 구성
- 단계별로 테스트하며 진행
- 문제 발생 시 범위 좁혀 디버깅 가능

#### 문서화의 중요성
- README.md로 실행 방법 명확히 안내
- 코드 주석으로 의도 전달
- .env.example로 설정 가이드 제공

#### Git 활용
- `.gitignore`로 불필요한 파일 제외
- 의미 있는 커밋 메시지 작성
- 다른 개발자 (또는 미래의 나) 배려

---

### 8.4 실무 적용 가능성

#### 확장 가능성
- **다양한 통화 지원**: EUR, JPY, CNY 등 추가 가능
- **인증/인가**: JWT 토큰 기반 사용자 인증
- **Rate Limiting**: 과도한 요청 방지
- **캐싱**: Redis로 자주 조회되는 환율 캐싱
- **마이크로서비스**: Apollo Federation으로 다른 서비스와 통합

#### 프로덕션 고려사항
- **에러 로깅**: Winston, Sentry 등 로깅 시스템
- **모니터링**: Prometheus, Grafana
- **배포**: Docker 컨테이너화, Kubernetes
- **CI/CD**: GitHub Actions, Jenkins
- **테스트**: Jest, Supertest로 자동화 테스트

---

### 8.5 개인적 성장

#### 문제 해결 능력
- 공식 문서 읽는 습관
- 에러 메시지 분석 능력
- Stack Overflow, GitHub Issues 활용

#### 코드 품질 의식
- 의미 있는 변수명 (`normalizedSrc` vs `s`)
- 함수 분리 (`getCurrentDate` 헬퍼)
- 주석으로 의도 전달

#### 기술 트렌드 이해
- GraphQL이 왜 떠오르는지
- NoSQL이 언제 적합한지
- 클라우드 네이티브 아키텍처 (Federation)

---

## 9. 참고 자료

### 9.1 공식 문서

#### GraphQL
- [GraphQL 공식 문서](https://graphql.org/learn/) - GraphQL 기초 개념
- [GraphQL Schema 가이드](https://graphql.org/learn/schema/) - SDL 문법

#### Apollo Server
- [Apollo Server 공식 문서](https://www.apollographql.com/docs/apollo-server/) - 서버 설정
- [Apollo Server v4 마이그레이션 가이드](https://www.apollographql.com/docs/apollo-server/migration) - v3 → v4
- [Apollo Federation](https://www.apollographql.com/docs/federation/) - 마이크로서비스 패턴

#### MongoDB & Mongoose
- [MongoDB 공식 문서](https://www.mongodb.com/docs/) - MongoDB 기초
- [Mongoose 공식 문서](https://mongoosejs.com/docs/) - ODM 사용법
- [Mongoose Schema](https://mongoosejs.com/docs/guide.html) - 스키마 정의
- [Mongoose Queries](https://mongoosejs.com/docs/queries.html) - CRUD 작업

#### Node.js
- [Node.js 공식 문서](https://nodejs.org/docs/) - Node.js API
- [ES Modules](https://nodejs.org/api/esm.html) - import/export 사용법

---

### 9.2 튜토리얼 & 블로그

- [Apollo Server Getting Started](https://www.apollographql.com/docs/apollo-server/getting-started) - 빠른 시작
- [GraphQL with MongoDB Tutorial](https://www.mongodb.com/developer/languages/javascript/graphql-with-mongodb/) - 통합 가이드
- [Mongoose Upsert 가이드](https://masteringjs.io/tutorials/mongoose/upsert) - upsert 패턴

---

### 9.3 도구 & 리소스

- [MongoDB Compass](https://www.mongodb.com/products/compass) - MongoDB GUI 클라이언트
- [Postman](https://www.postman.com/graphql/) - GraphQL API 테스트
- [GraphQL Playground](https://github.com/graphql/graphql-playground) - 스탠드얼론 테스트 도구

---

### 9.4 커뮤니티

- [Apollo Community](https://community.apollographql.com/) - Apollo 공식 포럼
- [GraphQL Discord](https://discord.graphql.org/) - GraphQL 커뮤니티
- [Stack Overflow - GraphQL](https://stackoverflow.com/questions/tagged/graphql) - Q&A

---

## 10. 향후 개선 사항

### 10.1 단기 개선

- [ ] **입력 검증**: 통화 코드 유효성 검사 (USD, KRW만 허용)
- [ ] **에러 처리**: 커스텀 에러 클래스 (`NotFoundError`, `ValidationError`)
- [ ] **로깅**: Winston으로 구조화된 로그
- [ ] **테스트**: Jest로 단위 테스트 작성

### 10.2 중기 개선

- [ ] **캐싱**: Redis로 자주 조회되는 환율 캐싱
- [ ] **인증**: JWT 기반 사용자 인증
- [ ] **Rate Limiting**: Express Rate Limit 적용
- [ ] **배치 조회**: DataLoader로 N+1 문제 해결

### 10.3 장기 개선

- [ ] **실시간 환율**: WebSocket/Subscription으로 실시간 업데이트
- [ ] **다중 통화**: EUR, JPY, CNY 등 확장
- [ ] **외부 API 연동**: 실제 환율 API (Open Exchange Rates)
- [ ] **마이크로서비스**: Apollo Federation Gateway 구성

---

## 마무리

이 프로젝트를 통해 **GraphQL, MongoDB, Node.js**의 핵심 개념을 실습하고, 실무에 적용 가능한 백엔드 API 서버를 구축했습니다.

단순히 코드를 작성하는 것을 넘어, **왜 이 기술을 선택했는지**, **어떤 문제를 마주했고 어떻게 해결했는지**, **어떻게 개선할 수 있는지**를 고민하며 개발자로서 한 단계 성장할 수 있었습니다.

---

**작성일**: 2024년 12월 3일
**프로젝트 버전**: 1.0.0
**작성자**: [Your Name]
