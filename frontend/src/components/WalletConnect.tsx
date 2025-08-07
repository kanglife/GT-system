import { useState } from 'react'

interface WalletConnectProps {
  readonly onWalletConnected: (address: string) => void
  readonly currentAddress?: string  
}

export default function WalletConnect({ onWalletConnected, currentAddress }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  // 🔥 App.tsx의 walletAddress를 기준으로 연결 상태 판단
  const isConnected = !!currentAddress

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask가 설치되지 않았습니다!')
      return
    }

    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[]
      
      if (accounts.length > 0) {
        const address = accounts[0]
        onWalletConnected(address)  // 🔥 App.tsx의 상태만 업데이트
      }
    } catch (error) {
      console.error('지갑 연결 실패:', error)
      alert('지갑 연결에 실패했습니다.')
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    onWalletConnected('')  // 🔥 App.tsx의 상태만 업데이트
  }

  return (
    <div>
      {!isConnected ? (
        <button 
          onClick={connectWallet}
          disabled={isConnecting}
          style={{
            padding: '10px',
            backgroundColor: '#0052ff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {isConnecting ? '연결 중...' : 'MetaMask 연결'}
        </button>
      ) : (
        <div>
          <button 
            onClick={disconnectWallet}
            style={{
              padding: '10px',
              backgroundColor: '#ff4757',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            연결 해제
          </button>
        </div>
      )}
    </div>
  )
}