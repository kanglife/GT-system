import { useState, useEffect } from 'react'
import './App.css'
import VotingSystem from './components/VotingSystem'
import WalletConnect from './components/WalletConnect'
import BalanceDisplay from './components/BalanceDisplay'
import { apiService } from './services/api'
import { commonStyles } from './styles/theme'
import { DEFAULT_USER_ID, PROPOSAL_COST } from './config/constants'

// 탭 타입 정의
type TabId = 'dashboard' | 'exchange' | 'governance' | 'settings'

interface Tab {
  id: TabId
  name: string
  icon: string
}

function App() {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  
  // 기존 상태들
  const [backendStatus, setBackendStatus] = useState<string>('연결 확인 중...')
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [exchangeResult, setExchangeResult] = useState<string>('')
  const [balanceUpdateTrigger, setBalanceUpdateTrigger] = useState<number>(0)
  const userId: string = DEFAULT_USER_ID

  // 백엔드 연결 테스트
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        await apiService.checkHealth()
        setBackendStatus('✅ 연결 성공!')
      } catch (error) {
        setBackendStatus('❌ 연결 실패')
        console.error('Backend connection failed:', error)
      }
    }
    
    checkBackendHealth()
  }, [])

  // 포인트-토큰 교환 함수 
  const exchangePointsToTokens = async (pointAmount: number): Promise<void> => {
    if (!walletAddress) {
      alert('먼저 지갑을 연결해주세요!')
      return
    }

    try {
      const response = await apiService.exchangePointsToTokens({
        userId,
        pointAmount,
        walletAddress
      })
      
      if (response.success) {
        setExchangeResult(`✅ 교환 성공! ${pointAmount} 포인트 → ${pointAmount} 토큰`)
        setBalanceUpdateTrigger(prev => prev + 1)
      } else {
        setExchangeResult(`❌ 교환 실패: ${response.message || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('Exchange error:', error)
      const errorMessage = error instanceof Error ? error.message : '교환 중 오류가 발생했습니다'
      setExchangeResult(`❌ ${errorMessage}`)
    }
  }

  // 탭 목록 정의
  const tabs: Tab[] = [
    { id: 'dashboard', name: '대시보드', icon: '📊' },
    { id: 'exchange', name: '포인트 교환', icon: '🔄' },
    { id: 'governance', name: '거버넌스', icon: '🗳️' },
    { id: 'settings', name: '설정', icon: '⚙️' }
  ]

  // 공통 스타일 (theme에서 가져옴)
  const styles = commonStyles

  // 대시보드 컨텐츠
  const DashboardContent = () => (
    <div>
      {/* 환영 메시지 */}
      <div style={{ ...styles.card, maxWidth: '600px', marginBottom: '30px'}}>
        <h3 style={styles.cardTitle}>환영합니다! 🎉</h3>
        <div style={{ color: '#666666', fontSize: '14px', lineHeight: '1.6' }}>
          <div>• Governance Token System에 오신 것을 환영합니다.</div>
          <div>•  이 시스템을 통해 포인트를 거버넌스 토큰으로 교환합니다.</div>
          <div>• 교환된 토큰은 거버넌스 투표에 사용할 수 있습니다.</div>
          <div>• 향후 DAO 투표에 참여할 수 있습니다.</div>
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => setActiveTab('exchange')}
              style={{
                ...styles.button,
                backgroundColor: '#3498db',
                color: 'white',
                marginRight: '10px'
              }}
            >
              포인트 교환하기
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              style={{
                ...styles.button,
                backgroundColor: '#95a5a6',
                color: 'white'
              }}
            >
              시스템 정보 보기
            </button>
          </div>
        </div>
      </div>
      {/* 상태 카드들 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>시스템 상태</h4>
          <p style={styles.cardText}>{backendStatus}</p>
        </div>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>사용자 정보</h4>
          <p style={styles.cardText}>사용자 ID: {userId}</p>
        </div>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>지갑 상태</h4>
          <p style={styles.cardText}>
            {walletAddress 
              ? `연결됨 (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)})` 
              : '연결되지 않음'
            }
          </p>
        </div>
      </div>

    </div>
  )

  // 포인트 교환 컨텐츠
  const ExchangeContent = () => (
    <div>
      {/* 잔액 정보 */}
      <div style={{ marginBottom: '30px' }}>
        <BalanceDisplay
          userId={userId}
          walletAddress={walletAddress}
          key={balanceUpdateTrigger}
        />
      </div>

      {/* 교환 기능 */}
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        ...styles.card
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={styles.cardTitle}>포인트 → 토큰 교환</h3>
          <p style={styles.cardText}>고정 비율: 1 포인트 = 1 토큰</p>
        </div>

        {/* 교환 정보 박스 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            padding: '15px',
            backgroundColor: '#e3f2fd',
            borderRadius: '6px',
            border: '1px solid #bbdefb',
            marginBottom: '10px',
            color: '#0d47a1'
          }}>
            <div style={{ fontSize: '12px', marginBottom: '5px' }}>교환할 포인트</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{PROPOSAL_COST.toLocaleString()} P</div>
          </div>
          
          <div style={{ textAlign: 'center', margin: '10px 0', fontSize: '20px' }}>⬇️</div>
          
          <div style={{
            padding: '15px',
            backgroundColor: '#f3e5f5',
            borderRadius: '6px',
            border: '1px solid #e1bee7',
            color: '#4a148c'
          }}>
            <div style={{ fontSize: '12px', marginBottom: '5px' }}>받을 토큰</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{PROPOSAL_COST.toLocaleString()} GT</div>
          </div>
        </div>
        
        <button 
          onClick={() => exchangePointsToTokens(PROPOSAL_COST)}
          disabled={!walletAddress}
          style={{
            ...styles.button,
            width: '100%',
            backgroundColor: walletAddress ? '#28a745' : '#6c757d',
            color: 'white'
          }}
        >
          {walletAddress ? '포인트 교환하기' : '지갑을 먼저 연결해주세요'}
        </button>
        
        {exchangeResult && (
          <div style={{
            marginTop: '20px',
            ...(exchangeResult.includes('성공') ? styles.successAlert : styles.errorAlert)
          }}>
            {exchangeResult}
          </div>
        )}
      </div>

      {/* 교환 안내 */}
      <div style={{ ...styles.card, marginTop: '30px', maxWidth: '500px', margin: '30px auto 0' }}>
        <h4 style={styles.cardTitle}>교환 안내</h4>
        <div style={{ color: '#666666', fontSize: '14px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '8px' }}>• 포인트와 토큰은 1:1 비율로 교환됩니다</div>
          <div style={{ marginBottom: '8px' }}>• 교환을 위해서는 MetaMask 지갑 연결이 필요합니다</div>
          <div style={{ marginBottom: '8px' }}>• 교환된 토큰은 거버넌스 투표에 사용할 수 있습니다</div>
          <div>• 트랜잭션 수수료(가스비)가 별도로 발생할 수 있습니다</div>
        </div>
      </div>
    </div>
  )

  // 거버넌스 컨텐츠
const GovernanceContent = () => (
  <VotingSystem 
    walletAddress={walletAddress}
  />
)

  // 설정 컨텐츠
  const SettingsContent = () => (
    <div>  
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* 지갑 연결 카드 */}
        <div style={{ ...styles.card, marginBottom: '20px' }}>
          <h3 style={styles.cardTitle}>지갑 연결</h3>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#333333', marginBottom: '5px' }}>
                현재 지갑 주소
              </div>
              <div style={{ color: '#666666', fontSize: '14px' }}>
                {walletAddress 
                  ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}` 
                  : '연결되지 않음'
                }
              </div>
            </div>
            <WalletConnect onWalletConnected={setWalletAddress} currentAddress={walletAddress}/>
          </div>
          <div style={{ fontSize: '12px', color: '#666666' }}>
            💡 MetaMask 지갑이 필요합니다. 설치 후 연결해주세요.
          </div>
        </div>

        {/* 시스템 정보 카드 */}
        <div style={{ ...styles.card, marginBottom: '20px' }}>
          <h3 style={styles.cardTitle}>시스템 정보</h3>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', color: '#333333', marginBottom: '5px' }}>
              사용자 ID
            </div>
            <div style={{ color: '#666666' }}>{userId}</div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', color: '#333333', marginBottom: '5px' }}>
              네트워크
            </div>
            <div style={{ color: '#666666' }}>Ethereum Mainnet</div>
          </div>
          <div>
            <div style={{ fontWeight: 'bold', color: '#333333', marginBottom: '5px' }}>
              백엔드 상태
            </div>
            <div style={{ color: '#666666' }}>{backendStatus}</div>
          </div>
        </div>

        {/* 구현된 기능 목록 */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>구현된 기능</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '10px'
          }}>
            {[
              '스마트 컨트랙트 (GovernanceToken)',
              '백엔드 API 서버 (JSON 파일 저장)',
              '포인트 시스템',
              '지갑 연결 (MetaMask)',
              '포인트-토큰 교환',
              '실시간 잔액 조회'
            ].map((feature, index) => (
              <div key={index} style={{
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '5px',
                border: '1px solid #e9ecef',
                color: '#333333',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                ✅ {feature}
              </div>
            ))}
          </div>
          
          <div style={{ borderTop: '1px solid #e9ecef' }}>
            <h4 style={{ color: '#666666', fontSize: '16px', marginBottom: '10px' }}>
              개발 환경 정보
            </h4>
            <div style={{ color: '#888888', fontSize: '12px', lineHeight: '1.5' }}>
              <div>• Frontend: React 18 + TypeScript</div>
              <div>• Backend: Node.js + Express</div>
              <div>• Blockchain: Ethereum (Solidity)</div>
              <div>• Wallet: MetaMask Integration</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />
      case 'exchange':
        return <ExchangeContent />
      case 'governance':
        return <GovernanceContent />
      case 'settings':
        return <SettingsContent />
      default:
        return <div style={{ color: '#333333' }}>페이지를 찾을 수 없습니다.</div>
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      color: '#333333'
    }}>
      {/* 헤더 */}
      <header style={{
        backgroundColor: '#2c3e50',
        color: '#ffffff',
        padding: '25px 0',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '32px',
            fontWeight: 'bold'
          }}>
            🏛️ Governance Token System
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '16px',
            opacity: 0.9
          }}>
            스마트 컨트랙트와 백엔드 API를 이용한 포인트-토큰 교환 시스템
          </p>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav style={{
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #e0e0e0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', gap: '0' }}>
            {tabs.map((tab: Tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '18px 30px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: activeTab === tab.id ? '#2c3e50' : '#666666',
                  borderBottom: activeTab === tab.id ? '3px solid #3498db' : '3px solid transparent',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        minHeight: 'calc(100vh - 200px)'
      }}>
        {renderTabContent()}
      </main>

      {/* 푸터 */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e0e0e0',
        padding: '20px 0',
        textAlign: 'center',
        color: '#666666'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            © 2024 Governance Token System. Built with React & Ethereum.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App