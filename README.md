# 블록체인 과제시험: 재화 교환 서비스

## 목표

- Web2 기반의 포인트 재화를 개발합니다.
- 블록체인 기반의 토큰을 개발합니다. 이 토큰은 거버넌스 토큰이며 투표 기능을 제공해야합니다.
- 포인트는 고정 비율로 토큰과 교환할 수 있습니다.
- 모든 기능을 테스트할 수 있는 웹 어플리케이션을 개발합니다.

## 메인넷

- Ethereum

## 참고

- 메타마스크 연결 필요

## 실행방법(터미널 로컬)


1. 블록체인 실행 
      
   프로젝트 폴더 > npm run node    
   ex) ddkms64-blockchain-test> npm run node
   
         governance-token-system@1.0.0 node   
         hardhat node  
         Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
---

2. 블록체인배포
   
   프로젝트 폴더 > npm run deploy    
   ex) ddkms64-blockchain-test> npm run deploy 

   배포후 blockchain.js > this.governanceTokenAddress = 실제배포된 주소 넣고 저장
   
         governance-token-system@1.0.0 deploy 
         hardhat run scripts/deploy.js --network localhost    
            🚀 Starting deployment...Deploying with account : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266    
            ✅ GovernanceToken deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
---

3. 백엔드 실행
   
   프로젝트 폴더\backend > npm run dev    
   ex) ddkms64-blockchain-test\backend> npm run dev
   
         governance-backend@1.0.0 dev 
         nodemon server.js
         [nodemon] 3.1.10
         [nodemon] to restart at any time, enter `rs`
         [nodemon] watching path(s): *.*
         [nodemon] watching extensions: js,mjs,cjs,json
         [nodemon] starting `node server.js`
         🚀 Backend server running on http://localhost:3001
         📋 Available modules:
            💰 Points System - /api/points/*
            🔄 Token Exchange - /api/exchange/*
            🗳️  Voting System - /api/voting/*

         🗳️ Voting Rules:
            • 투표권: 100 GT = 1표
            • 제안 생성: 최소 1,000 GT (10표) 필요
            • 투표 기간: 7일

3. 프론트엔트 실행
   
   프로젝트 폴더\frontend> npm run dev   
   ex) ddkms64-blockchain-test\frontend> npm run dev
   
         frontend@0.0.0 dev 
         vite
         오후 12:23:09 [vite] (client) Re-optimizing dependencies because lockfile has changed

         VITE v7.0.6  ready in 485 ms

         ➜  Local:   http://localhost:5173/
         ➜  Network: use --host to expose
         ➜  press h + enter to show help
