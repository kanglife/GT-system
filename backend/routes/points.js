const express = require('express');
const dataService = require('../services/dataService');
const router = express.Router();

// 사용자 포인트 조회
router.get('/balance/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    let user = dataService.getUser(userId);
    
    // 사용자가 없으면 생성
    if (!user) {
      dataService.saveUser(userId, {});
      user = dataService.getUser(userId);
    }
    
    res.json({
      userId,
      pointBalance: user.pointBalance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting point balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get point balance',
      error: error.message
    });
  }
});

// 포인트 적립
router.post('/earn', (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'userId and amount are required'
      });
    }

    const user = dataService.updateUserPoints(userId, amount, reason || 'Points earned');
    
    res.json({
      success: true,
      message: `${amount} points earned`,
      userId,
      amount,
      reason,
      newBalance: user.pointBalance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error earning points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to earn points',
      error: error.message
    });
  }
});

// 포인트 차감
router.post('/deduct', (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'userId and amount are required'
      });
    }

    const user = dataService.updateUserPoints(userId, -amount, 'Points deducted for token exchange');
    
    res.json({
      success: true,
      message: `${amount} points deducted`,
      userId,
      amount,
      newBalance: user.pointBalance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deducting points:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 사용자 트랜잭션 내역 조회
router.get('/transactions/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const user = dataService.getUser(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      userId,
      transactions: user.transactions.slice(-10), // 최근 10개만
      total: user.transactions.length
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: error.message
    });
  }
});

module.exports = router;