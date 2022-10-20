const { getNamedAccounts, deployments, network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

const DECIMALS = "8"
const INITIAL_PRICE = "200000000000" // 2000

module.exports = async ({ getNamedAccounts, deployments, network }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    if (developmentChains.includes(network.name)) {
        log("Deploying Mocks");
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE]
        });
        
        log("Mock deployed");
        log("-----------------------------------------------------------");
    }
}

module.exports.tags = ["all", "mocks"]