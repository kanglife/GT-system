import { useState, useEffect, useCallback } from 'react'
import { apiService } from '../services/api'

interface BalanceDisplayProps {
  userId: string
  walletAddress: string
  onBalanceUpdate?: () => void
}

export default function BalanceDisplay({ userId, walletAddress, onBalanceUpdate }: BalanceDisplayProps) {
  const [pointBalance, setPointBalance] = useState(0)
  const [tokenBalance, setTokenBalance] = useState('0')
  const [loading, setLoading] = useState(false)

  // 포인트 잔액 조회
  const fetchPointBalance = useCallback(async () => {
    if (!userId) return
    
    try {
      const response = await apiService.getUserBalance(userId)
      setPointBalance(response.pointBalance as number)
    } catch (error) {
      console.error('Failed to fetch point balance:', error)
    }
  }, [userId])

  // 토큰 잔액 조회
  const fetchTokenBalance = useCallback(async () => {
    if (!walletAddress) return
    
    try {
      const response = await apiService.getVotingPower(walletAddress)
      setTokenBalance((response.tokenBalance as string) || '0')
    } catch (error) {
      console.error('Failed to fetch token balance:', error)
    }
  }, [walletAddress])

  // 모든 잔액 새로고침
  const refreshBalances = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchPointBalance(), fetchTokenBalance()])
    setLoading(false)
    if (onBalanceUpdate) onBalanceUpdate()
  }, [fetchPointBalance, fetchTokenBalance, onBalanceUpdate])

  // 컴포넌트 마운트시 및 props 변경시 잔액 조회
  useEffect(() => {
    refreshBalances()
  }, [refreshBalances])

  // 포인트 적립 테스트
  const earnPoints = async () => {
    try {
      const response = await apiService.earnPoints({
        userId,
        amount: 1000,
        reason: 'Daily bonus'
      })
      
      if (response.success) {
        setPointBalance(response.newBalance as number)
        alert(`✅ ${response.amount as number} 포인트가 적립되었습니다!`)
      } else {
        alert(`❌ 포인트 적립 실패: ${response.message}`)
      }
    } catch (error) {
      console.error('Failed to earn points:', error)
      alert('❌ 포인트 적립 중 오류 발생')
    }
  }

  return (
    <div style={{ 
      margin: '20px 0', 
      padding: '20px', 
      border: '2px solid #007bff',
      borderRadius: '10px',
      backgroundColor: '#1a2238'
    }}>
      <h3 style={{ marginTop: '0px', color: '#ffffff' }}>💰 잔액 현황</h3>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginBottom: '15px'
      }}>
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#0d47a1' }}>포인트</h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0d47a1' }}>
            {pointBalance.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#444' }}>Points</div>
        </div>

        <div style={{ 
          padding: '15px', 
          backgroundColor: '#d0f0d0', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1b5e20' }}>토큰</h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1b5e20' }}>
            {parseFloat(tokenBalance).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#444' }}>GT Tokens</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button 
          onClick={refreshBalances}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {loading ? '새로고침 중...' : '🔄 잔액 새로고침'}
        </button>

        <button 
          onClick={earnPoints}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          🎁 포인트 1000개 적립
        </button>
      </div>
    </div>
  )
}