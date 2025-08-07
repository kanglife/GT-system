const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GovernanceToken", function () {
  let governanceToken;
  let owner;
  let user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    
    const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
    governanceToken = await GovernanceToken.deploy(owner.address);
  });

  it("Should deploy with correct name and symbol", async function () {
    expect(await governanceToken.name()).to.equal("Governance Token");
    expect(await governanceToken.symbol()).to.equal("GT");
  });

  it("Should mint initial supply to owner", async function () {
    const maxSupply = await governanceToken.MAX_SUPPLY();
    const initialSupply = maxSupply / 10n;
    const ownerBalance = await governanceToken.balanceOf(owner.address);
    
    expect(ownerBalance).to.equal(initialSupply);
  });

  it("Should allow owner to mint tokens", async function () {
    const mintAmount = ethers.parseEther("1000");
    await governanceToken.mint(user1.address, mintAmount);
    
    const balance = await governanceToken.balanceOf(user1.address);
    expect(balance).to.equal(mintAmount);
  });
});