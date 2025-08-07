// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Blockchain Configuration  
export const BLOCKCHAIN_RPC_URL = import.meta.env.VITE_BLOCKCHAIN_RPC_URL || 'http://localhost:8545';

// User Configuration
export const DEFAULT_USER_ID = import.meta.env.VITE_DEFAULT_USER_ID || 'user123';

// Token & Voting Configuration
export const TOKEN_PER_VOTE = Number(import.meta.env.VITE_TOKEN_PER_VOTE) || 100;
export const PROPOSAL_COST = Number(import.meta.env.VITE_PROPOSAL_COST) || 1000;
export const VOTING_DURATION_DAYS = Number(import.meta.env.VITE_VOTING_DURATION_DAYS) || 7;

// API Endpoints
export const API_ENDPOINTS = {
  // Voting endpoints
  VOTING_POWER: (address: string) => `/api/voting/voting-power/${address}`,
  PROPOSALS: '/api/voting/proposals',
  CREATE_PROPOSAL: '/api/voting/proposals/create',
  VOTE: (proposalId: number) => `/api/voting/proposals/${proposalId}/vote`,
  USER_VOTES: (address: string) => `/api/voting/votes/${address}`,
  
  // Exchange endpoints
  EXCHANGE_POINTS: '/api/exchange/points-to-tokens',
  BALANCE: (userId: string) => `/api/points/balance/${userId}`,
  
  // Health check
  HEALTH: '/'
} as const;