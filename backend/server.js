const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// 라우트
const pointsRoutes = require('./routes/points');
const exchangeRoutes = require('./routes/exchange');
const votingRoutes = require('./routes/voting'); // 🗳️ 투표 라우트 추가

app.use('/api/points', pointsRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/voting', votingRoutes); // 🗳️ 투표 라우터 연결

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'Governance Token Backend API',
    status: 'running',
    version: '2.0.0', // 투표 시스템 추가
    features: [
      '💰 Points System',
      '🔄 Token Exchange', 
      '🗳️ Voting System' // 새로 추가
    ],
    endpoints: {
      points: [
        'GET /api/points/balance/:userId',
        'POST /api/points/earn'
      ],
      exchange: [
        'POST /api/exchange/points-to-tokens',
        'GET /api/exchange/token-balance/:walletAddress',
        'GET /api/exchange/history/:userId'
      ],
      voting: [ // 🗳️ 새로 추가된 투표 엔드포인트들
        'GET /api/voting/proposals',
        'POST /api/voting/proposals/create', 
        'POST /api/voting/proposals/:id/vote',
        'GET /api/voting/voting-power/:walletAddress',
        'GET /api/voting/votes/:walletAddress'
      ]
    },
    votingRules: { // 🗳️ 투표 규칙 설명
      votingPower: `${process.env.TOKEN_PER_VOTE || 100} GT = 1표`,
      minProposalTokens: '1,000 GT (10표)',
      votingPeriod: '7일'
    },
    timestamp: new Date().toISOString()
  });
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log('📋 Available modules:');
  console.log('   💰 Points System - /api/points/*');
  console.log('   🔄 Token Exchange - /api/exchange/*');
  console.log('   🗳️  Voting System - /api/voting/*'); // 새로 추가
  console.log('');
  console.log('🗳️ Voting Rules:');
  console.log(`   • 투표권: ${process.env.TOKEN_PER_VOTE || 100} GT = 1표`);
  console.log('   • 제안 생성: 최소 1,000 GT (10표) 필요');
  console.log('   • 투표 기간: 7일');
});

module.exports = app;