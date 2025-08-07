const { ethers } = require('ethers');

class BlockchainService {
  constructor() {
    // 로컬 하드햇 네트워크 연결
    this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');
    
    // 배포된 컨트랙트 주소
    this.governanceTokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // 실제 배포된 주소로 변경 필요
    
    // 백엔드 서명용 지갑 (하드햇 기본 계정 - 컨트랙트 소유자)
    this.backendWallet = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      this.provider
    );

    // 실제 GovernanceToken 컨트랙트 ABI
    this.tokenAbi = [
      "function mint(address to, uint256 amount) external",
      "function balanceOf(address owner) view returns (uint256)",
      "function totalSupply() view returns (uint256)",
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)"
    ];

    console.log('🔗 BlockchainService initialized');
    console.log('📍 Contract address:', this.governanceTokenAddress);
    console.log('🔑 Backend wallet:', this.backendWallet.address);
  }

  // 연결 테스트
  async testConnection() {
    try {
      const network = await this.provider.getNetwork();
      console.log('🌐 Connected to network:', network.chainId.toString());
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  // 실제 토큰 발행
  async mintTokens(userAddress, tokenAmount) {
    try {
      console.log(`🔨 Minting ${tokenAmount} tokens to ${userAddress}...`);
      
      const contract = new ethers.Contract(
        this.governanceTokenAddress,
        this.tokenAbi,
        this.backendWallet
      );
      
      // 컨트랙트 기본 정보 확인 (선택사항)
      try {
        const name = await contract.name();
        const symbol = await contract.symbol();
        console.log(`📋 Contract: ${name} (${symbol})`);
      } catch (infoError) {
        console.log('⚠️ Could not get contract info, but proceeding...');
        console.error('Contract info error:', infoError);
      }
      
      // 토큰 발행 트랜잭션 실행
      console.log('📤 Sending mint transaction...');
      const tx = await contract.mint(
        userAddress, 
        ethers.parseEther(tokenAmount.toString())
      );
      
      console.log('⏳ Transaction sent:', tx.hash);
      console.log('⏳ Waiting for confirmation...');
      
      // 트랜잭션 완료 대기
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
      
      return { 
        success: true, 
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('❌ Token minting failed:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // 토큰 잔액 조회
  async getTokenBalance(userAddress) {
    try {
      const contract = new ethers.Contract(
        this.governanceTokenAddress,
        this.tokenAbi,
        this.provider
      );
      
      const balance = await contract.balanceOf(userAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('❌ Token balance query failed:', error);
      return '0';
    }
  }

  // 포인트-토큰 교환 서명 생성
  async createExchangeSignature(userAddress, pointAmount) {
    try {
      const nonce = ethers.keccak256(ethers.toUtf8Bytes(`${userAddress}-${Date.now()}`));
      
      const message = ethers.solidityPackedKeccak256(
        ['address', 'uint256', 'bytes32'],
        [userAddress, pointAmount, nonce]
      );
      
      const signature = await this.backendWallet.signMessage(ethers.getBytes(message));
      
      return {
        signature,
        nonce,
        message,
        signer: this.backendWallet.address
      };
    } catch (error) {
      console.error('❌ Signature creation failed:', error);
      throw error;
    }
  }
}

module.exports = new BlockchainService();