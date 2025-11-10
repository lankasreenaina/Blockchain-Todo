const fs = require('fs');
const path = require('path');
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },
  // We add a new task here to handle deployment and copying artifacts
  defaultNetwork: "localhost",
};

// This task deploys the contract and copies the contract address and ABI
// to the frontend folder, ensuring the frontend is always up to date.
task("deploy-and-copy", "Deploys the contract and copies artifacts to the frontend")
  .setAction(async (taskArgs, hre) => {
    const OnchainTodo = await hre.ethers.getContractFactory("OnchainTodo");
    const onchainTodo = await OnchainTodo.deploy();
    await onchainTodo.waitForDeployment();
    
    console.log("OnchainTodo deployed to:", onchainTodo.target);

    // Create the directory if it doesn't exist
    const frontendArtifactsDir = path.join(__dirname, '..', 'app-frontend', 'src', 'artifacts');
    if (!fs.existsSync(frontendArtifactsDir)) {
      fs.mkdirSync(frontendArtifactsDir, { recursive: true });
    }

    // Copy the contract ABI to the frontend
    const contractABI = hre.artifacts.readArtifactSync("OnchainTodo");
    fs.writeFileSync(
      path.join(frontendArtifactsDir, "OnchainTodo.json"),
      JSON.stringify(contractABI, null, 2)
    );

    // Write the contract address to a separate file
    fs.writeFileSync(
      path.join(frontendArtifactsDir, "contractAddress.js"),
      `export const contractAddress = "${onchainTodo.target}";\n`
    );

    console.log("Contract artifacts copied to frontend.");
  });
