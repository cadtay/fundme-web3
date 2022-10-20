const { ethers, getNamedAccounts, network } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("Funding...");

    const transactionResponse = await fundMe.withdraw();
    await transactionResponse.wait(1);

    console.log("Withdrew");
}

main()
.catch((error) => {
    console.log(error);
    process.exit(1);
})