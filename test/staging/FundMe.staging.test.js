const { ethers, getNamedAccounts, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const {  assert } = require("chai");

developmentChains.includes(network.name) 
    ? describe.skip 
    : describe("FundMe", async () => {
        let fundMe;
        let deployer;
        const sendValue = ethers.utils.parseEther("1.0");

        beforeEach("undMe", async () => {
            deployer = (await getNamedAccounts()).deployer;
            fundMe = await ethers.getContract("FundMe", deployer);
        });

        it("Allows people to fund and withdraw", async () => {
            await fundMe.fun({value: sendValue});
            await fundMe.withdraw();
            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            assert.equal(endingFundMeBalance.toString(), "0")
        });
    })