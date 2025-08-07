// API Response Types
export interface BaseApiResponse {
  success: boolean;
  message?: string;
}

export interface VotingPowerResponse extends BaseApiResponse {
  votingPower: number;
  tokenBalance: string;
}

export interface ProposalsResponse extends BaseApiResponse {
  proposals: Proposal[];
}

export interface UserVotesResponse extends BaseApiResponse {
  votes: Vote[];
}

export interface PointsBalanceResponse extends BaseApiResponse {
  pointBalance: number;
}

export interface EarnPointsResponse extends BaseApiResponse {
  newBalance: number;
  amount: number;
}

export interface CreateProposalResponse extends BaseApiResponse {
  tokenDeducted: number;
}

export interface VoteResponse extends BaseApiResponse {
  newVotingPower: number;
}

// Data Types
export interface Proposal {
  id: number;
  title: string;
  description: string;
  creator: string;
  startTime: number;
  endTime: number;
  votes: {
    yes: number;
    no: number;
  };
  totalVotes: number;
  isActive: boolean;
  createdAt: string;
}

export interface Vote {
  proposalId: number;
  voter: string;
  choice: 'yes' | 'no';
  votingPower: number;
  timestamp: number;
  createdAt: string;
}