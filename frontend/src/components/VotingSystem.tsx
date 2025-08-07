import { useState, useEffect, useCallback } from 'react'
import { apiService } from '../services/api'
import { commonStyles } from '../styles/theme'
import { TOKEN_PER_VOTE } from '../config/constants'
import type { Proposal, Vote } from '../types/api'

interface VotingSystemProps {
  readonly walletAddress: string
}


export default function VotingSystem({ walletAddress }: VotingSystemProps) {
  const styles = commonStyles
  // 투표 관련 상태들
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [userVotes, setUserVotes] = useState<Vote[]>([])
  const [votingPower, setVotingPower] = useState(0)
  const [activeTab, setActiveTab] = useState<'proposals' | 'create' | 'myVotes'>('proposals')
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: ''
  })

  // 투표권 조회 함수
  const fetchVotingPower = useCallback(async (): Promise<void> => {
    if (!walletAddress) return
    
    try {
      const response = await apiService.getVotingPower(walletAddress)
      setVotingPower(response.votingPower as number)
      console.log(`💰 투표권: ${response.votingPower as number}표 (${response.tokenBalance as string} GT)`)
    } catch (error) {
      console.error('투표권 조회 실패:', error)
    }
  }, [walletAddress])

  // 제안 목록 조회 함수
  const fetchProposals = async (): Promise<void> => {
    try {
      const response = await apiService.getProposals()
      
      if (response.success) {
        setProposals(response.proposals as Proposal[])
        console.log(`📋 ${(response.proposals as Proposal[]).length}개 제안 로드됨`)
      }
    } catch (error) {
      console.error('제안 목록 조회 실패:', error)
    }
  }

  // 사용자 투표 내역 조회 함수
  const fetchUserVotes = useCallback(async (): Promise<void> => {
    if (!walletAddress) return
    
    try {
      const response = await apiService.getUserVotes(walletAddress)
      
      if (response.success) {
        setUserVotes(response.votes as Vote[])
        console.log(`🗳️ ${(response.votes as Vote[]).length}개 투표 내역 로드됨`)
      }
    } catch (error) {
      console.error('투표 내역 조회 실패:', error)
    }
  }, [walletAddress])

  // 🔥 새로 추가: 제안 삭제 함수
  const deleteProposal = async (proposalId: number): Promise<void> => {
    if (!walletAddress) {
      alert('먼저 지갑을 연결해주세요!')
      return
    }

    const proposal = proposals.find(p => p.id === proposalId)
    if (!proposal) {
      alert('제안을 찾을 수 없습니다.')
      return
    }

    // 본인이 만든 제안인지 확인
    if (proposal.creator.toLowerCase() !== walletAddress.toLowerCase()) {
      alert('본인이 작성한 제안만 삭제할 수 있습니다.')
      return
    }

    // 확인 다이얼로그
    if (!confirm(`정말로 "${proposal.title}" 제안을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      const response = await fetch(`http://localhost:3001/api/voting/proposals/${proposalId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: walletAddress
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert(`✅ 제안이 성공적으로 삭제되었습니다!`)
        fetchProposals() // 제안 목록 새로고침
        fetchUserVotes() // 투표 내역도 새로고침 (삭제된 제안과 연관된 투표 제거)
      } else {
        alert(`❌ 제안 삭제 실패: ${data.message}`)
      }
    } catch (error) {
      console.error('제안 삭제 실패:', error)
      alert('❌ 제안 삭제 중 오류 발생')
    }
  }

  // 새 제안 생성 함수 (🔥 투표권 차감 반영)
  const createProposal = async (): Promise<void> => {
    if (!walletAddress) {
      alert('먼저 지갑을 연결해주세요!')
      return
    }

    if (!newProposal.title.trim() || !newProposal.description.trim()) {
      alert('제목과 설명을 모두 입력해주세요!')
      return
    }

    try {
      const response = await apiService.createProposal({
        title: newProposal.title,
        description: newProposal.description,
        walletAddress: walletAddress
      })
      
      if (response.success) {
        alert(`✅ 제안이 성공적으로 생성되었습니다!\n💰 사용된 토큰: ${response.tokenDeducted} GT (10표)`)
        setNewProposal({ title: '', description: '' })
        setActiveTab('proposals')
        
        // 투표권 즉시 업데이트
        fetchVotingPower()
        fetchProposals()
      } else {
        alert(`❌ 제안 생성 실패: ${response.message}`)
      }
    } catch (error) {
      console.error('제안 생성 실패:', error)
      alert('❌ 제안 생성 중 오류 발생')
    }
  }

  // 투표 함수 (🔥 투표권 차감 반영)
  const vote = async (proposalId: number, choice: 'yes' | 'no'): Promise<void> => {
    if (!walletAddress) {
      alert('먼저 지갑을 연결해주세요!')
      return
    }

    try {
      const response = await apiService.vote(proposalId, {
        walletAddress: walletAddress,
        choice: choice
      })
      
      if (response.success) {
        alert(`✅ 투표 완료! (${choice === 'yes' ? '찬성' : '반대'})\n💰 사용된 토큰: ${TOKEN_PER_VOTE} GT (1표)`)
        
        // 투표권 즉시 업데이트
        fetchVotingPower()
        fetchProposals()
        fetchUserVotes()
      } else {
        alert(`❌ 투표 실패: ${response.message}`)
      }
    } catch (error) {
      console.error('투표 실패:', error)
      alert('❌ 투표 중 오류 발생')
    }
  }

  // 지갑 주소 변경 시 투표 관련 데이터 새로고침
  useEffect(() => {
    if (walletAddress) {
      fetchVotingPower()
      fetchUserVotes()
    }
  }, [walletAddress, fetchVotingPower, fetchUserVotes])

  // 컴포넌트 마운트 시 제안 목록 로드
  useEffect(() => {
    fetchProposals()
  }, [])

  // 헬퍼 함수들
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeLeft = (endTime: number): string => {
    const now = Date.now()
    const diff = endTime - now
    
    if (diff <= 0) return '종료됨'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    return `${days}일 ${hours}시간 남음`
  }

  const hasUserVotedOnProposal = (proposalId: number): boolean => {
    return userVotes.some(vote => vote.proposalId === proposalId)
  }

  const getUserVoteChoice = (proposalId: number): string => {
    const vote = userVotes.find(vote => vote.proposalId === proposalId)
    let result = ''
    if (vote) {
      result = vote.choice === 'yes' ? '찬성' : '반대'
    }
    return result
  }

  // 🔥 새로 추가: 현재 사용자가 제안 작성자인지 확인하는 함수
  const isProposalCreator = (proposal: Proposal): boolean => {
    return typeof walletAddress === 'string' && walletAddress !== '' && proposal.creator.toLowerCase() === walletAddress.toLowerCase()
  }

  const tabs = [
    { id: 'proposals', name: '제안 목록', icon: '📋' },
    { id: 'create', name: '제안 작성', icon: '📝' },
    { id: 'myVotes', name: '내 투표', icon: '🗳️' }
  ]

  let createButtonText = '';
  if (!walletAddress) {
    createButtonText = '지갑을 먼저 연결해주세요';
  } else if (votingPower < 10) {
    createButtonText = `투표권이 부족합니다 (${votingPower}/10표)`;
  } else {
    createButtonText = '제안 생성하기';
  }

  return (
    <div>
      <h2 style={{ color: '#222222', marginBottom: '20px' }}>🗳️ 거버넌스</h2>
      
      {/* 투표권 정보 */}
      <div style={{ 
        ...styles.card, 
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: 'white' }}>내 투표권</h4>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {votingPower.toLocaleString()}표
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              {TOKEN_PER_VOTE} GT = 1표
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              {walletAddress ? '투표 가능' : '지갑 연결 필요'}
            </div>
            <button
              onClick={fetchVotingPower}
              style={{
                padding: '5px 10px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                marginTop: '5px'
              }}
            >
              🔄 새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 투표 탭 */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #e0e0e0',
        marginBottom: '20px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'proposals' | 'create' | 'myVotes')}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? '#667eea' : '#666666',
              borderBottom: activeTab === tab.id ? '2px solid #667eea' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal'
            }}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </div>

      {/* 제안 목록 탭 */}
      {activeTab === 'proposals' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#222222' }}>제안 목록</h3>
            <button
              onClick={fetchProposals}
              style={{
                padding: '8px 15px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔄 새로고침
            </button>
          </div>

          {proposals.length === 0 ? (
            <div style={{ ...styles.card, textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
              <h3 style={{ color: '#666666' }}>아직 제안이 없습니다</h3>
              <p style={{ color: '#888888' }}>첫 번째 제안을 작성해보세요!</p>
              <button
                onClick={() => setActiveTab('create')}
                style={{
                  marginTop: '15px',
                  padding: '10px 20px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                제안 작성하기
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {proposals.map(proposal => (
                <div key={proposal.id} style={{
                  ...styles.card,
                  borderLeft: `4px solid ${proposal.isActive ? '#28a745' : '#6c757d'}`
                }}>
                  {/* 🔥 제안 헤더 - 삭제 버튼 추가 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        background: proposal.isActive ? '#28a745' : '#6c757d',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {proposal.isActive ? '진행중' : '종료됨'}
                      </span>
                      {isProposalCreator(proposal) && (
                        <span style={{
                          background: '#17a2b8',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          내 제안
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#666666' }}>
                        #{proposal.id}
                      </div>
                      {/* 🔥 삭제 버튼 - 제안 작성자만 표시 */}
                      {isProposalCreator(proposal) && (
                        <button
                          onClick={() => deleteProposal(proposal.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}
                          title="제안 삭제"
                        >
                          🗑️ 삭제
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <h4 style={{ margin: '0 0 10px 0', color: '#222222' }}>
                    {proposal.title}
                  </h4>
                  <p style={{ margin: '0 0 15px 0', color: '#555555', fontSize: '14px' }}>
                    {proposal.description}
                  </p>
                  
                  <div style={{ fontSize: '12px', color: '#666666', marginBottom: '15px' }}>
                    <div>제안자: {proposal.creator}</div>
                    <div>기간: {formatDate(proposal.startTime)} ~ {formatDate(proposal.endTime)}</div>
                    <div style={{ 
                      color: proposal.isActive ? '#28a745' : '#dc3545', 
                      fontWeight: 'bold' 
                    }}>
                      {getTimeLeft(proposal.endTime)}
                    </div>
                  </div>

                  {/* 투표 현황 */}
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '12px', color: '#666666', marginBottom: '8px' }}>
                      투표 현황 (총 {proposal.totalVotes}표)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '10px', 
                        backgroundColor: '#d4edda', 
                        borderRadius: '4px' 
                      }}>
                        <div style={{ fontSize: '12px', color: '#155724' }}>찬성</div>
                        <div style={{ fontWeight: 'bold', color: '#155724', fontSize: '18px' }}>
                          {proposal.votes.yes}표
                        </div>
                      </div>
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '10px', 
                        backgroundColor: '#f8d7da', 
                        borderRadius: '4px' 
                      }}>
                        <div style={{ fontSize: '12px', color: '#721c24' }}>반대</div>
                        <div style={{ fontWeight: 'bold', color: '#721c24', fontSize: '18px' }}>
                          {proposal.votes.no}표
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 투표 버튼 */}
                  {(() => {
                    let voteButtonContent;
                    if (walletAddress && proposal.isActive && !hasUserVotedOnProposal(proposal.id)) {
                      voteButtonContent = (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => vote(proposal.id, 'yes')}
                            style={{
                              flex: 1,
                              padding: '10px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                          >
                            ✅ 찬성 (1표)
                          </button>
                          <button
                            onClick={() => vote(proposal.id, 'no')}
                            style={{
                              flex: 1,
                              padding: '10px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                          >
                            ❌ 반대 (1표)
                          </button>
                        </div>
                      );
                    } else if (hasUserVotedOnProposal(proposal.id)) {
                      voteButtonContent = (
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: '#e9ecef', 
                          borderRadius: '5px', 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          color: '#495057'
                        }}>
                          ✅ 투표 완료 ({getUserVoteChoice(proposal.id)})
                        </div>
                      );
                    } else if (!walletAddress) {
                      voteButtonContent = (
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: '#fff3cd', 
                          borderRadius: '5px', 
                          textAlign: 'center',
                          color: '#856404'
                        }}>
                          투표하려면 지갑을 연결해주세요
                        </div>
                      );
                    } else {
                      voteButtonContent = (
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: '#f8d7da', 
                          borderRadius: '5px', 
                          textAlign: 'center',
                          color: '#721c24'
                        }}>
                          투표 기간이 종료되었습니다
                        </div>
                      );
                    }
                    return voteButtonContent;
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 제안 작성 탭 */}
      {activeTab === 'create' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>새 제안 작성</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="proposal-title" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                제안 제목
              </label>
              <input
                id="proposal-title"
                type="text"
                value={newProposal.title}
                onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="제안 제목을 입력하세요"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="proposal-description" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                제안 설명
              </label>
              <textarea
                id="proposal-description"
                value={newProposal.description}
                onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="제안에 대한 자세한 설명을 입력하세요"
                rows={5}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#e3f2fd',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#0d47a1'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>📋 제안 작성 요건:</div>
              <div>• 최소 10표({(TOKEN_PER_VOTE * 10).toLocaleString()} GT) 보유 필요</div>
              <div>• 투표 기간: 7일</div>
              <div>• 제안 작성자는 언제든지 제안을 삭제할 수 있습니다</div>
              <div>• 현재 투표권: {votingPower}표</div>
            </div>

            <button
              onClick={createProposal}
              disabled={!walletAddress || votingPower < 10}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: (walletAddress && votingPower >= 10) ? '#667eea' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: (walletAddress && votingPower >= 10) ? 'pointer' : 'not-allowed'
              }}
            >
              {createButtonText}
            </button>
          </div>
        </div>
      )}

      {/* 내 투표 탭 */}
      {activeTab === 'myVotes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#222222' }}>내 투표 내역</h3>
            <button
              onClick={fetchUserVotes}
              style={{
                padding: '8px 15px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔄 새로고침
            </button>
          </div>

          {userVotes.length === 0 ? (
            <div style={{ ...styles.card, textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗳️</div>
              <h3 style={{ color: '#666666' }}>아직 투표 내역이 없습니다</h3>
              <p style={{ color: '#888888' }}>활성 제안에 투표해보세요!</p>
              <button
                onClick={() => setActiveTab('proposals')}
                style={{
                  marginTop: '15px',
                  padding: '10px 20px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                제안 목록 보기
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {userVotes.map((vote) => {
                const proposal = proposals.find(p => p.id === vote.proposalId)
                return (
                  <div key={vote.proposalId} style={{
                    ...styles.card,
                    borderLeft: `4px solid ${vote.choice === 'yes' ? '#28a745' : '#dc3545'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, color: '#222222' }}>
                        {proposal?.title || `제안 #${vote.proposalId}`}
                      </h4>
                      <span style={{
                        background: vote.choice === 'yes' ? '#28a745' : '#dc3545',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {vote.choice === 'yes' ? '찬성' : '반대'}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#666666' }}>
                      <div>투표한 표수: {vote.votingPower}표</div>
                      <div>투표 시간: {formatDate(vote.timestamp)}</div>
                    </div>
                    
                    {proposal && (
                      <div style={{ 
                        marginTop: '10px', 
                        padding: '10px', 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>현재 투표 현황:</div>
                        <div>찬성 {proposal.votes.yes}표 | 반대 {proposal.votes.no}표</div>
                        {(() => {
                          let leadingVote = '';
                          if (proposal.votes.yes > proposal.votes.no) {
                            leadingVote = '찬성';
                          } else if (proposal.votes.no > proposal.votes.yes) {
                            leadingVote = '반대';
                          } else {
                            leadingVote = '동점';
                          }
                          return (
                            <div>
                              현재 {leadingVote} 우세
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}