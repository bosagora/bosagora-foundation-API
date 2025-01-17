import { ethers } from "ethers";
import fs from "fs";


function getTokenContract(address: string): ethers.Contract {
    const provider = new ethers.providers.JsonRpcProvider("https://eth.llamarpc.com");
    const abi = JSON.parse(fs.readFileSync("./src/abi/ERC20.json", "utf8"));
    return new ethers.Contract(address, abi, provider);
}

async function main() {
    const contract = getTokenContract("0xfcBe0B695c13257bd43D64f09Db433034E90033D");
    const balance = await contract.balanceOf("0x2529379aC2c209058ADf4c28f2C963878eA5E7bd");
    console.log(balance.toString());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
