import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("\n🚀 Deploying SecretRedPacket...");
  console.log("📍 Deployer:", deployer);

  const deployment = await deploy("SecretRedPacket", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  console.log("\n✅ SecretRedPacket deployed!");
  console.log("📄 Contract address:", deployment.address);
  console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${deployment.address}`);
  console.log("\n💡 Remember to update NEXT_PUBLIC_CONTRACT_ADDRESS in frontend .env.local");
};

export default func;
func.tags = ["SecretRedPacket"];

