const { deployments, ethers, network } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name) 
    ? describe.skip 
    : describe("FundMe", async() => {
    let fundMe;
    let deployer;
    let mockV3Aggregator;
    const sendValue = ethers.utils.parseEther("1.0");

    beforeEach(async() => {
        deployer = (await getNamedAccounts()).deployer;

        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
    });

    describe("constructor", async() => {
        it("sets the aggregator addresses correctly", async() => {
            const response = await fundMe.getPriceFeed();
            assert.equal(response, mockV3Aggregator.address);
        });
    });

    describe("fund", async() => {
        it("Fails if you don't send enough ETH", async() => {
            await expect(fundMe.fund()).to.be.revertedWith("Did not send enough")
        });

        it("Updates the amount funded data structure", async() => {
            await fundMe.fund({ value: sendValue });
            const response = await fundMe.getAddressToAmountedFunded(deployer);
            assert.equal(response.toString(), sendValue.toString());
        });

        it("Adds funder to array of funders", async() => {
            await fundMe.fund({value: sendValue});
            const funder = await fundMe.getFunder(0);
            assert.equal(funder, deployer);
        });
    });

    describe("Withdraw", async() => {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue });
        });

        it("withdraw ETH from a single founder", async() => {
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

            const transactionResponse = await fundMe.withdraw();
            const transactionReciept = await transactionResponse.wait(1);

            const { gasUsed, effectiveGasPrice } = transactionReciept;
            const totalGasCost = gasUsed.mul(effectiveGasPrice);

            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

            assert.equal(endingFundMeBalance, 0);
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(totalGasCost).toString());
        });

        it("Allows us to withdraw with multiple funders", async () => {
            const accounts = await ethers.getSigners();

            for (let i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(accounts[i]);
                await fundMeConnectedContract.fund({value:sendValue})

                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

                const transactionResponse = await fundMe.withdraw();
                const transactionReciept = await transactionResponse.wait(1);

                const { gasUsed, effectiveGasPrice } = transactionReciept;
                const totalGasCost = gasUsed.mul(effectiveGasPrice);

                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

                assert.equal(endingFundMeBalance, 0);
                assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(totalGasCost).toString());
                await expect(fundMe.getFunder(0)).to.be.reverted
                
                for (i = 1; i < 6; i++) {
                    assert.equal(await fundMe.getAddressToAmountedFunded(accounts[i].address), 0)
                }
            }
        });

        it("Only allows the owner to withdraw", async () => {
            const accounts = await ethers.getSigners();
            const attacker = accounts[1];
            const attackerConnectContract = await fundMe.connect(attacker);
            await expect(attackerConnectContract.withdraw()).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
        });
    });
});