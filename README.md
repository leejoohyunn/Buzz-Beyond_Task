# Exchange Rate GraphQL API

원화(KRW)와 미화(USD) 간 환율 정보를 관리하는 GraphQL API 서버입니다.

## 기술 스택

- **Backend**: Node.js, Apollo Server, GraphQL
- **Database**: MongoDB (Mongoose ODM)
- **환경변수 관리**: dotenv

## 프로젝트 구조

```
exchange-rate-api/
├── src/
│   ├── config/
│   │   └── database.js       # MongoDB 연결 설정
│   ├── models/
│   │   └── ExchangeRate.js   # Mongoose 스키마 및 모델
│   ├── resolvers/
│   │   └── index.js          # GraphQL Resolver 구현
│   ├── schema/
│   │   └── typeDefs.js       # GraphQL 타입 정의
│   └── index.js              # 서버 진입점
├── .env                      # 환경변수 파일
├── .env.example              # 환경변수 예시
├── package.json
└── README.md
```

## 설정 및 실행 방법

### 1. 사전 요구사항

- Node.js (v18 이상)
- MongoDB (로컬 또는 MongoDB Atlas)

### 2. MongoDB 설치 및 실행

**Windows:**
```bash
# MongoDB Community Edition 다운로드 및 설치
# https://www.mongodb.com/try/download/community

# MongoDB 서비스 시작
net start MongoDB
```

**Mac (Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. 프로젝트 설정

```bash
# 저장소 클론 (또는 다운로드)
git clone <repository-url>
cd exchange-rate-api

# 의존성 설치
npm install

# 환경변수 설정 (.env 파일 생성)
cp .env.example .env
```

### 4. 환경변수 설정

`.env` 파일을 열어 MongoDB 연결 정보를 설정합니다:

```env
MONGODB_URI=mongodb://localhost:27017/exchange-rate-db
PORT=5110
```

### 5. 서버 실행

```bash
# 프로덕션 모드
npm start

# 개발 모드 (파일 변경 시 자동 재시작)
npm run dev
```

서버가 정상적으로 시작되면 다음과 같은 메시지가 출력됩니다:

```
MongoDB connected successfully
🚀 Server ready at http://localhost:5110/
📊 GraphQL endpoint: http://localhost:5110/graphql
```

## API 사용법

### GraphQL Schema

```graphql
type Query {
  "환율조회"
  getExchangeRate(src: String!, tgt: String!): ExchangeInfo
}

type Mutation {
  "환율등록/수정 (upsert)"
  postExchangeRate(info: InputUpdateExchangeInfo): ExchangeInfo
  "환율삭제"
  deleteExchangeRate(info: InputDeleteExchangeInfo): ExchangeInfo
}

type ExchangeInfo {
  src: String!
  tgt: String!
  rate: Float!
  date: String!
}
```

### 테스트 예시

#### 1. 환율 등록

```bash
curl -XPOST "http://localhost:5110/graphql" \
-H "accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "query": "mutation { postExchangeRate (info: { src: \"usd\", tgt: \"krw\", rate: 1342.11, date:\"2022-11-28\" }) { src tgt rate date } }"
}'
```

**응답:**
```json
{
  "data": {
    "postExchangeRate": {
      "src": "usd",
      "tgt": "krw",
      "rate": 1342.11,
      "date": "2022-11-28"
    }
  }
}
```

#### 2. 환율 조회

```bash
curl -XPOST "http://localhost:5110/graphql" \
-H "accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "query": "query { getExchangeRate (src: \"usd\", tgt: \"krw\") { src tgt rate date } }"
}'
```

**응답:**
```json
{
  "data": {
    "getExchangeRate": {
      "src": "usd",
      "tgt": "krw",
      "rate": 1342.11,
      "date": "2022-11-28"
    }
  }
}
```

#### 3. 같은 통화 조회 (항상 rate=1)

```bash
curl -XPOST "http://localhost:5110/graphql" \
-H "accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "query": "query { getExchangeRate (src: \"krw\", tgt: \"krw\") { src tgt rate date } }"
}'
```

**응답:**
```json
{
  "data": {
    "getExchangeRate": {
      "src": "krw",
      "tgt": "krw",
      "rate": 1,
      "date": "2022-11-28"
    }
  }
}
```

#### 4. 환율 삭제

```bash
curl -XPOST "http://localhost:5110/graphql" \
-H "accept: application/json" \
-H "Content-Type: application/json" \
-d '{
  "query": "mutation { deleteExchangeRate (info: { src: \"usd\", tgt: \"krw\", date:\"2022-11-28\" }) { src tgt rate date } }"
}'
```

**응답:**
```json
{
  "data": {
    "deleteExchangeRate": {
      "src": "usd",
      "tgt": "krw",
      "rate": 1342.11,
      "date": "2022-11-28"
    }
  }
}
```

## 주요 기능

### 1. 환율 조회 (getExchangeRate)
- 소스 통화(src)와 타겟 통화(tgt)를 입력받아 최신 환율 정보를 반환
- 같은 통화 간 환율은 항상 1로 반환 (예: KRW→KRW, USD→USD)

### 2. 환율 등록/수정 (postExchangeRate)
- src, tgt, date 조합으로 upsert 동작
- date를 생략하면 현재 날짜로 자동 설정
- 같은 통화 간 환율 등록 시 입력값 무시하고 항상 1로 저장

### 3. 환율 삭제 (deleteExchangeRate)
- 특정 날짜의 특정 통화 간 환율 정보를 삭제
- 같은 통화 간 환율 삭제는 DB 작업 없이 rate=1 반환

## 데이터베이스 스키마

```javascript
{
  src: String,      // 소스 통화 (소문자)
  tgt: String,      // 타겟 통화 (소문자)
  rate: Number,     // 환율
  date: String,     // 기준일 (YYYY-MM-DD)
  timestamps: true  // createdAt, updatedAt 자동 생성
}

// Unique Index: (src, tgt, date)
```

## 문제 해결

### MongoDB 연결 오류
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**해결방법:** MongoDB 서비스가 실행 중인지 확인하세요.

```bash
# Windows
net start MongoDB

# Mac/Linux
brew services start mongodb-community
# 또는
sudo systemctl start mongod
```

### 포트 충돌
```
Error: listen EADDRINUSE: address already in use :::5110
```
**해결방법:** `.env` 파일에서 다른 포트로 변경하거나, 5110 포트를 사용 중인 프로세스를 종료하세요.

## GraphQL Playground

서버 실행 후 브라우저에서 `http://localhost:5110/graphql`에 접속하면 Apollo Server의 GraphQL Playground를 사용할 수 있습니다.

## 라이선스

ISC
