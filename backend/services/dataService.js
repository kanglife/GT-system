const fs = require('fs');
const path = require('path');

class DataService {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.tokensFile = path.join(this.dataDir, 'tokens.json');
    this.proposalsFile = path.join(this.dataDir, 'proposals.json');
    this.votesFile = path.join(this.dataDir, 'votes.json');
    
    // 데이터 폴더가 없으면 생성
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // 사용자 파일이 없으면 초기 데이터로 생성
    if (!fs.existsSync(this.usersFile)) {
      this.saveUsers({
        'user123': {
          userId: 'user123',
          pointBalance: 5000,
          walletAddress: null,
          transactions: []
        }
      });
    }

    // 토큰 파일이 없으면 생성
    if (!fs.existsSync(this.tokensFile)) {
      this.saveTokenBalances({});
    }

    // 제안 파일이 없으면 생성
    if (!fs.existsSync(this.proposalsFile)) {
      this.saveProposals({});
    }
  
    // 투표 파일이 없으면 생성
    if (!fs.existsSync(this.votesFile)) {
      this.saveVotes({});
    }
  }

  // 기존 사용자 관련 메서드들...
  loadUsers() {
    try {
      const data = fs.readFileSync(this.usersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading users:', error);
      return {};
    }
  }

  saveUsers(users) {
    try {
      fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving users:', error);
      return false;
    }
  }

  getUser(userId) {
    const users = this.loadUsers();
    return users[userId] || null;
  }

  saveUser(userId, userData) {
    const users = this.loadUsers();
    users[userId] = {
      userId,
      pointBalance: 1000,
      walletAddress: null,
      transactions: [],
      createdAt: new Date().toISOString(),
      ...userData,
      updatedAt: new Date().toISOString()
    };
    return this.saveUsers(users);
  }

  updateUserPoints(userId, pointChange, reason = '') {
    const users = this.loadUsers();
    
    if (!users[userId]) {
      users[userId] = {
        userId,
        pointBalance: 1000,
        walletAddress: null,
        transactions: [],
        createdAt: new Date().toISOString()
      };
    }

    const user = users[userId];
    const oldBalance = user.pointBalance;
    const newBalance = oldBalance + pointChange;

    if (newBalance < 0) {
      throw new Error('Insufficient points');
    }

    user.pointBalance = newBalance;
    user.updatedAt = new Date().toISOString();

    user.transactions.push({
      type: pointChange > 0 ? 'earn' : 'deduct',
      amount: Math.abs(pointChange),
      reason,
      oldBalance,
      newBalance,
      timestamp: new Date().toISOString()
    });

    this.saveUsers(users);
    return user;
  }

  addExchangeTransaction(userId, pointAmount, tokenAmount, txHash) {
    const users = this.loadUsers();
    const user = users[userId];
    
    if (user) {
      user.transactions.push({
        type: 'exchange',
        pointAmount,
        tokenAmount,
        txHash,
        timestamp: new Date().toISOString()
      });
      
      this.saveUsers(users);
    }
  }

  // 기존 토큰 관련 메서드들
  loadTokenBalances() {
    try {
      const data = fs.readFileSync(this.tokensFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading token balances:', error);
      return {};
    }
  }

  saveTokenBalances(tokenBalances) {
    try {
      fs.writeFileSync(this.tokensFile, JSON.stringify(tokenBalances, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving token balances:', error);
      return false;
    }
  }

  getTokenBalance(walletAddress) {
    const tokenBalances = this.loadTokenBalances();
    const walletKey = walletAddress.toLowerCase();
    return tokenBalances[walletKey] || 0;
  }

  updateTokenBalance(walletAddress, amount) {
    const tokenBalances = this.loadTokenBalances();
    const walletKey = walletAddress.toLowerCase();
    
    if (!tokenBalances[walletKey]) {
      tokenBalances[walletKey] = 0;
    }
    
    tokenBalances[walletKey] += amount;
    this.saveTokenBalances(tokenBalances);
    
    return tokenBalances[walletKey];
  }

  // 🗳️ 새로 추가되는 투표 관련 메서드들

  // 투표권 계산 (TOKEN_PER_VOTE GT = 1표)
  getVotingPower(walletAddress) {
    const tokens = this.getTokenBalance(walletAddress);
    const tokenPerVote = parseInt(process.env.TOKEN_PER_VOTE) || 100;
    return Math.floor(tokens / tokenPerVote);
  }

  // 제안 데이터 로드
  loadProposals() {
    try {
      const data = fs.readFileSync(this.proposalsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading proposals:', error);
      return {};
    }
  }

  // 제안 데이터 저장
  saveProposals(proposals) {
    try {
      fs.writeFileSync(this.proposalsFile, JSON.stringify(proposals, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving proposals:', error);
      return false;
    }
  }

  // 새 제안 저장
  saveProposal(proposal) {
    const proposals = this.loadProposals();
    proposals[proposal.id] = proposal;
    this.saveProposals(proposals);
    return proposal;
  }

  // 🔥 새로 추가: 제안 삭제
  deleteProposal(proposalId) {
    try {
      const proposals = this.loadProposals();
      
      if (!proposals[proposalId]) {
        throw new Error(`제안 ID ${proposalId}를 찾을 수 없습니다`);
      }
      
      const deletedProposal = proposals[proposalId];
      
      // 제안 삭제
      delete proposals[proposalId];
      
      // 파일에 저장
      this.saveProposals(proposals);
      
      console.log(`✅ 제안 삭제 완료: ID ${proposalId} - ${deletedProposal.title}`);
      return deletedProposal;
    } catch (error) {
      console.error('제안 삭제 실패:', error);
      throw error;
    }
  }

  // 투표 데이터 로드
  loadVotes() {
    try {
      const data = fs.readFileSync(this.votesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading votes:', error);
      return {};
    }
  }

  // 투표 데이터 저장
  saveVotes(votes) {
    try {
      fs.writeFileSync(this.votesFile, JSON.stringify(votes, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving votes:', error);
      return false;
    }
  }

  // 새 투표 저장
  saveVote(vote) {
    const votes = this.loadVotes();
    const voteKey = `${vote.proposalId}_${vote.voter}`;
    votes[voteKey] = vote;
    this.saveVotes(votes);
    return vote;
  }

  // 🔥 새로 추가: 특정 제안의 모든 투표 삭제
  deleteVotesByProposalId(proposalId) {
    try {
      const votes = this.loadVotes();
      const originalVoteKeys = Object.keys(votes);
      let deletedCount = 0;
      
      // 해당 제안에 대한 모든 투표 찾아서 삭제
      originalVoteKeys.forEach(voteKey => {
        if (votes[voteKey] && votes[voteKey].proposalId === proposalId) {
          delete votes[voteKey];
          deletedCount++;
        }
      });
      
      // 파일에 저장
      this.saveVotes(votes);
      
      console.log(`✅ 제안 ${proposalId}의 투표 ${deletedCount}개 삭제 완료`);
      return deletedCount;
    } catch (error) {
      console.error('투표 삭제 실패:', error);
      throw error;
    }
  }

  // 🔥 새로 추가: 특정 사용자의 특정 제안 투표 삭제
  deleteVote(proposalId, walletAddress) {
    try {
      const votes = this.loadVotes();
      const voteKey = `${proposalId}_${walletAddress.toLowerCase()}`;
      
      if (!votes[voteKey]) {
        throw new Error(`투표를 찾을 수 없습니다: ${voteKey}`);
      }
      
      const deletedVote = votes[voteKey];
      delete votes[voteKey];
      
      // 파일에 저장
      this.saveVotes(votes);
      
      console.log(`✅ 투표 삭제 완료: ${voteKey}`);
      return deletedVote;
    } catch (error) {
      console.error('투표 삭제 실패:', error);
      throw error;
    }
  }

  // 사용자가 특정 제안에 투표했는지 확인
  hasUserVoted(proposalId, walletAddress) {
    const votes = this.loadVotes();
    const voteKey = `${proposalId}_${walletAddress.toLowerCase()}`;
    return !!votes[voteKey];
  }

  // 제안의 투표 집계
  getProposalVotes(proposalId) {
    const votes = this.loadVotes();
    const proposalVotes = Object.values(votes).filter(v => v.proposalId === proposalId);
    
    return proposalVotes.reduce((acc, vote) => {
      acc[vote.choice] = (acc[vote.choice] || 0) + vote.votingPower;
      return acc;
    }, { yes: 0, no: 0 });
  }

  // 🔥 새로 추가: 제안 ID로 제안 조회
  getProposalById(proposalId) {
    const proposals = this.loadProposals();
    return proposals[proposalId] || null;
  }

  // 🔥 새로 추가: 모든 제안과 투표 데이터 정리 (개발용)
  cleanupData() {
    try {
      console.log('🧹 데이터 정리 시작...');
      
      const proposals = this.loadProposals();
      const votes = this.loadVotes();
      
      const proposalIds = Object.keys(proposals).map(id => parseInt(id));
      let cleanedVotes = 0;
      
      // 존재하지 않는 제안에 대한 투표 삭제
      Object.keys(votes).forEach(voteKey => {
        const vote = votes[voteKey];
        if (!proposalIds.includes(vote.proposalId)) {
          delete votes[voteKey];
          cleanedVotes++;
        }
      });
      
      if (cleanedVotes > 0) {
        this.saveVotes(votes);
        console.log(`🧹 정리 완료: ${cleanedVotes}개 고아 투표 삭제됨`);
      } else {
        console.log('🧹 정리 완료: 삭제할 데이터 없음');
      }
      
      return {
        proposalsCount: proposalIds.length,
        votesCount: Object.keys(votes).length,
        cleanedVotes: cleanedVotes
      };
    } catch (error) {
      console.error('데이터 정리 실패:', error);
      throw error;
    }
  }
}

module.exports = new DataService();