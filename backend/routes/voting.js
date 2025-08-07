const express = require('express');
const dataService = require('../services/dataService');
const router = express.Router();

router.get('/proposals', (req, res) => {
  try {
    const proposalsData = dataService.loadProposals();
    const proposals = Object.values(proposalsData);
    
    const proposalsWithVotes = proposals.map(proposal => {
      const votes = dataService.getProposalVotes(proposal.id);
      return {
        ...proposal,
        votes,
        totalVotes: votes.yes + votes.no,
        isActive: Date.now() < proposal.endTime
      };
    });
    
    res.json({
      success: true,
      proposals: proposalsWithVotes,
      total: proposals.length
    });
  } catch (error) {
    console.error('❌ 제안 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '제안 목록을 불러오는데 실패했습니다',
      error: error.message
    });
  }
});

router.post('/proposals/create', (req, res) => {
  try {
    const { title, description, walletAddress } = req.body;
    
    if (!title || !description || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: '제목, 설명, 지갑주소는 필수입니다'
      });
    }
    
    const votingPower = dataService.getVotingPower(walletAddress);
    if (votingPower < 10) {
      return res.status(400).json({
        success: false,
        message: `제안 생성을 위해서는 최소 10표(1,000 GT)가 필요합니다. 현재: ${votingPower}표`
      });
    }
    
    const proposalCost = parseInt(process.env.PROPOSAL_COST) || 1000;
    const newTokenBalance = dataService.updateTokenBalance(walletAddress, -proposalCost);
    
    const proposalId = Date.now();
    const newProposal = {
      id: proposalId,
      title: title.trim(),
      description: description.trim(),
      creator: walletAddress.toLowerCase(),
      startTime: Date.now(),
      endTime: Date.now() + ((parseInt(process.env.VOTING_DURATION_DAYS) || 7) * 24 * 60 * 60 * 1000),
      createdAt: new Date().toISOString(),
      creationCost: proposalCost
    };
    
    dataService.saveProposal(newProposal);
    
    res.json({
      success: true,
      message: '제안이 성공적으로 생성되었습니다',
      proposal: newProposal,
      tokenDeducted: proposalCost,
      newTokenBalance: newTokenBalance
    });
    
  } catch (error) {
    console.error('❌ 제안 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: '제안 생성에 실패했습니다',
      error: error.message
    });
  }
});

router.delete('/proposals/:id/delete', (req, res) => {
  const proposalId = parseInt(req.params.id);
  
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: '지갑주소는 필수입니다'
      });
    }
    
    const proposals = dataService.loadProposals();
    const proposal = proposals[proposalId];
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: '제안을 찾을 수 없습니다'
      });
    }
    
    if (proposal.creator.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: '본인이 작성한 제안만 삭제할 수 있습니다'
      });
    }
    
    const deletedVotes = dataService.deleteVotesByProposalId(proposalId);
    dataService.deleteProposal(proposalId);
    
    res.json({
      success: true,
      message: '제안이 성공적으로 삭제되었습니다',
      deletedProposal: {
        id: proposalId,
        title: proposal.title
      },
      deletedVotesCount: deletedVotes
    });
    
  } catch (error) {
    console.error('❌ 제안 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '제안 삭제에 실패했습니다',
      error: error.message
    });
  }
});

router.post('/proposals/:id/vote', (req, res) => {
  const proposalId = parseInt(req.params.id);
  
  try {
    const { walletAddress, choice } = req.body;
    
    if (!walletAddress || !choice) {
      return res.status(400).json({
        success: false,
        message: '지갑주소와 선택은 필수입니다'
      });
    }
    
    if (!['yes', 'no'].includes(choice)) {
      return res.status(400).json({
        success: false,
        message: '선택은 yes 또는 no만 가능합니다'
      });
    }
    
    const proposals = dataService.loadProposals();
    const proposal = proposals[proposalId];
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: '제안을 찾을 수 없습니다'
      });
    }
    
    if (Date.now() > proposal.endTime) {
      return res.status(400).json({
        success: false,
        message: '투표 기간이 종료되었습니다'
      });
    }
    
    if (dataService.hasUserVoted(proposalId, walletAddress)) {
      return res.status(400).json({
        success: false,
        message: '이미 이 제안에 투표하셨습니다'
      });
    }
    
    const votingPower = dataService.getVotingPower(walletAddress);
    if (votingPower < 1) {
      return res.status(400).json({
        success: false,
        message: `투표권이 없습니다. 최소 ${process.env.TOKEN_PER_VOTE || 100} GT(1표)가 필요합니다`
      });
    }
    
    const voteCost = parseInt(process.env.TOKEN_PER_VOTE) || 100;
    const voteCount = 1;
    const newTokenBalance = dataService.updateTokenBalance(walletAddress, -voteCost);
    
    const vote = {
      proposalId: proposalId,
      voter: walletAddress.toLowerCase(),
      choice: choice,
      votingPower: voteCount,
      tokenCost: voteCost,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    dataService.saveVote(vote);
    const updatedVotes = dataService.getProposalVotes(proposalId);
    
    res.json({
      success: true,
      message: '투표가 성공적으로 완료되었습니다',
      vote: vote,
      proposalVotes: updatedVotes,
      tokenDeducted: voteCost,
      votesUsed: voteCount,
      newTokenBalance: newTokenBalance,
      newVotingPower: Math.floor(newTokenBalance / (parseInt(process.env.TOKEN_PER_VOTE) || 100))
    });
    
  } catch (error) {
    console.error('❌ 투표 실패:', error);
    res.status(500).json({
      success: false,
      message: '투표 처리에 실패했습니다',
      error: error.message
    });
  }
});

router.get('/voting-power/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  
  try {
    const tokens = dataService.getTokenBalance(walletAddress);
    const votingPower = dataService.getVotingPower(walletAddress);
    
    res.json({
      walletAddress: walletAddress,
      tokenBalance: tokens,
      votingPower: votingPower,
      formula: `${process.env.TOKEN_PER_VOTE || 100} GT = 1표`
    });
  } catch (error) {
    console.error('❌ 투표권 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '투표권 조회에 실패했습니다',
      error: error.message
    });
  }
});

router.get('/votes/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  
  try {
    const allVotes = dataService.loadVotes();
    const userVotes = Object.values(allVotes).filter(
      vote => vote.voter === walletAddress.toLowerCase()
    );
    
    res.json({
      success: true,
      walletAddress: walletAddress,
      votes: userVotes,
      total: userVotes.length
    });
  } catch (error) {
    console.error('❌ 투표 내역 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '투표 내역 조회에 실패했습니다',
      error: error.message
    });
  }
});

module.exports = router;