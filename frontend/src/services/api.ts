import { API_BASE_URL, API_ENDPOINTS } from '../config/constants';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

// API Error class
export class ApiError extends Error {
  status?: number;
  response?: unknown;
  
  constructor(
    message: string,
    status?: number,
    response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

// HTTP Client wrapper
class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || `HTTP error! status: ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error occurred'
      );
    }
  }

  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create HTTP client instance
export const apiClient = new HttpClient(API_BASE_URL);

// API service functions
export const apiService = {
  // Health check
  async checkHealth() {
    return apiClient.get(API_ENDPOINTS.HEALTH);
  },

  // Voting related APIs
  async getVotingPower(address: string) {
    return apiClient.get(API_ENDPOINTS.VOTING_POWER(address));
  },

  async getProposals() {
    return apiClient.get(API_ENDPOINTS.PROPOSALS);
  },

  async createProposal(data: { title: string; description: string; walletAddress: string }) {
    return apiClient.post(API_ENDPOINTS.CREATE_PROPOSAL, data);
  },

  async vote(proposalId: number, data: { walletAddress: string; choice: 'yes' | 'no' }) {
    return apiClient.post(API_ENDPOINTS.VOTE(proposalId), data);
  },

  async getUserVotes(address: string) {
    return apiClient.get(API_ENDPOINTS.USER_VOTES(address));
  },

  // Exchange related APIs
  async exchangePointsToTokens(data: { userId: string; pointAmount: number; walletAddress: string }) {
    return apiClient.post(API_ENDPOINTS.EXCHANGE_POINTS, data);
  },

  async getUserBalance(userId: string) {
    return apiClient.get(API_ENDPOINTS.BALANCE(userId));
  },

  // Points related APIs
  async earnPoints(data: { userId: string; amount: number; reason: string }) {
    return apiClient.post('/api/points/earn', data);
  },
} as const;