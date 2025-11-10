const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying OnchainTodo contract...");
  
  const OnchainTodo = await ethers.getContractFactory("OnchainTodo");
  const onchainTodo = await OnchainTodo.deploy();
  
  await onchainTodo.waitForDeployment();
  const address = await onchainTodo.getAddress();
  
  console.log("OnchainTodo deployed to:", address);
  
  // Copy ABI to frontend
  const artifactsPath = path.join(__dirname, "..", "artifacts", "contracts", "OnchainTodo.sol", "OnchainTodo.json");
  const frontendAbiPath = path.join(__dirname, "..", "app-frontend", "src", "contracts", "OnchainTodoABI.json");
  
  if (fs.existsSync(artifactsPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactsPath, "utf8"));
    const abi = artifact.abi;
    
    // Ensure directory exists
    const dir = path.dirname(frontendAbiPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(frontendAbiPath, JSON.stringify(abi, null, 2));
    // console.log("ABI copied to frontend:", frontendAbiPath);
  } else {
    console.log("Artifact not found, ABI not copied");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });