import { useState } from 'react'

interface ExchangePanelProps {
  userId: string
  walletAddress: string
  pointBalance: number
  onExchangeComplete: () => void
}

export default function ExchangePanel({ 
  userId, 
  walletAddress, 
  pointBalance, 
  onExchangeComplete 
}: ExchangePanelProps) {
  const [exchangeAmount, setExchangeAmount] = useState(1000)
  const [isExchanging, setIsExchanging] = useState(false)
  const [exchangeResult, setExchangeResult] = useState('')

  const exchangePointsToTokens = async () => {
    if (!walletAddress) {
      alert('먼저 지갑을 연결해주세요!')
      return
    }

    if (pointBalance < exchangeAmount) {
      alert(`포인트가 부족합니다! (현재: ${pointBalance}, 필요: ${exchangeAmount})`)
      return
    }

    setIsExchanging(true)
    setExchangeResult('')

    try {
      const response = await fetch('http://localhost:3001/api/exchange/points-to-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          pointAmount: exchangeAmount,
          walletAddress
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setExchangeResult(`✅ 교환 성공! ${exchangeAmount} 포인트 → ${exchangeAmount} 토큰`)
        setExchangeAmount(1000) // 초기값으로 리셋
        onExchangeComplete() // 부모 컴포넌트에 완료 알림
      } else {
        setExchangeResult(`❌ 교환 실패: ${data.message}`)
      }
    } catch (error) {
      console.error('Exchange error:', error)
      setExchangeResult('❌ 교환 중 오류 발생')
    } finally {
      setIsExchanging(false)
    }
  }

  return (
    <div style={{ 
      margin: '20px 0', 
      padding: '20px', 
      border: '2px solid #28a745',
      borderRadius: '10px',
      backgroundColor: '#f8fff8'
    }}>
      <h3>🔄 포인트 → 토큰 교환</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          교환할 포인트 수:
        </label>
        <input 
          type="number"
          value={exchangeAmount}
          onChange={(e) => setExchangeAmount(Number(e.target.value))}
          min="100"
          max={pointBalance}
          step="100"
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '200px'
          }}
        />
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          교환 비율: 1:1 (1 포인트 = 1 토큰)
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div>받을 토큰: <strong>{exchangeAmount} GT</strong></div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          수수료: 0% (무료)
        </div>
      </div>

      <button 
        onClick={exchangePointsToTokens}
        disabled={isExchanging || !walletAddress || pointBalance < exchangeAmount}
        style={{
          padding: '12px 24px',
          backgroundColor: (walletAddress && pointBalance >= exchangeAmount) ? '#28a745' : '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: (walletAddress && pointBalance >= exchangeAmount) ? 'pointer' : 'not-allowed',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {isExchanging ? '교환 중...' : `${exchangeAmount} 포인트 교환`}
      </button>

      {exchangeResult && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: exchangeResult.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${exchangeResult.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px'
        }}>
          {exchangeResult}
        </div>
      )}
    </div>
  )
}