const express = require('express');
const dataService = require('../services/dataService');
const router = express.Router();

// 간단한 포인트-토큰 교환 (파일 기반 토큰 저장)
router.post('/points-to-tokens', async (req, res) => {
  console.log('🔍 Simple exchange request received:', req.body);
  
  try {
    const { userId, pointAmount, walletAddress } = req.body;
    
    console.log('📝 Basic validation...');
    if (!userId || !pointAmount || !walletAddress) {
      console.log('❌ Missing fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    console.log('🔍 Checking points...');
    const user = dataService.getUser(userId);
    console.log('👤 User:', user?.userId, 'Points:', user?.pointBalance);
    
    if (!user || user.pointBalance < pointAmount) {
      console.log('❌ Not enough points');
      return res.status(400).json({
        success: false,
        message: `Not enough points. Have: ${user?.pointBalance || 0}, Need: ${pointAmount}`
      });
    }

    console.log('💰 Deducting points...');
    const updatedUser = dataService.updateUserPoints(userId, -pointAmount, 'Simple token exchange');
    console.log('✅ Points deducted. New balance:', updatedUser.pointBalance);

    // 토큰 잔액 업데이트 (파일에 저장)
    console.log('🪙 Adding tokens to file...');
    const newTokenBalance = dataService.updateTokenBalance(walletAddress, pointAmount);
    console.log('✅ Token balance updated in file:', newTokenBalance);

    console.log('🎉 Exchange completed successfully');
    res.json({
      success: true,
      message: 'Exchange completed successfully!',
      data: {
        userId,
        pointAmount,
        tokenAmount: pointAmount,
        walletAddress,
        newPointBalance: updatedUser.pointBalance,
        newTokenBalance: newTokenBalance,
        txHash: 'simple_' + Date.now(),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Exchange error:', error);
    res.status(500).json({
      success: false,
      message: 'Exchange failed',
      error: error.message
    });
  }
});

// 실제 토큰 잔액 조회 (파일에서)
router.get('/token-balance/:walletAddress', (req, res) => {
  console.log('🔍 Token balance request for:', req.params.walletAddress);
  
  const balance = dataService.getTokenBalance(req.params.walletAddress);
  console.log('💰 Current token balance from file:', balance);
  
  res.json({
    walletAddress: req.params.walletAddress,
    tokenBalance: balance.toString(),
    timestamp: new Date().toISOString()
  });
});

// 교환 내역
router.get('/history/:userId', (req, res) => {
  console.log('🔍 History request for:', req.params.userId);
  try {
    const user = dataService.getUser(req.params.userId);
    const history = user ? user.transactions.slice(-5) : [];
    
    res.json({
      userId: req.params.userId,
      exchangeHistory: history,
      total: history.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 디버깅용
router.get('/debug', (req, res) => {
  console.log('🐛 Debug info requested');
  const tokenBalances = dataService.loadTokenBalances();
  console.log('💾 Current token balances from file:', tokenBalances);
  
  res.json({
    success: true,
    tokenBalances: tokenBalances,
    totalWallets: Object.keys(tokenBalances).length,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;