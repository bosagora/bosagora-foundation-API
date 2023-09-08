import { BigNumber, ethers } from "ethers";
import fs from "fs";
import { Scheduler } from "../../modules";
import { logger } from "../../service/common/Logger";
import pool from "../../dbconfig/dbconnector";
import { PoolClient } from "pg";
import storage from "../../service/storage/Storage";

export class SupplyAPIScheduler extends Scheduler {
    private ETHProvider;
    private AgoraProvider;
    private readonly BOAcontract;
    private readonly InitialSupply: BigNumber;
    private readonly BridgeLiquidity: BigNumber; // Bridge Liquidity Supply
    private readonly BridgeFoundationLiquidity: BigNumber; // Bridge Foundation Stake Amount
    private readonly FoundationAddress: string;
    private readonly MarketingAddress1: string;
    private readonly MarketingAddress2: string;
    private readonly BountyAddress: string;
    private readonly TeamMemberAddress: string;
    private readonly BurnAddress: string;
    private readonly CommonsBudgetAddress: string; // Agora mainnet
    private readonly DWFTransferAddress: string;
    private readonly HoledAirdropAddress: Array<string>;

    constructor() {
        super(Number(process.env.INTERVAL));
        this.ETHProvider = new ethers.providers.JsonRpcProvider(process.env.ETH_PROVIDER);
        this.AgoraProvider = new ethers.providers.JsonRpcProvider(process.env.AGORA_PROVIDER);

        this.InitialSupply = BigNumber.from("5421301301958463");
        this.BridgeFoundationLiquidity = BigNumber.from("400000000000000");
        this.BridgeLiquidity = BigNumber.from("10000000000000");

        this.FoundationAddress = "0x2529379ac2c209058adf4c28f2c963878ea5e7bd";
        this.MarketingAddress1 = "0xb18ff7999757fe1e00ced454927b39812f3418aa";
        this.MarketingAddress2 = "0x4327bb17a6408d8ff94c7be88c20c521ad85d6d7";
        this.BountyAddress = "0x30e5794f87003b15a40827be2cc1c2ae4bc79435";
        this.TeamMemberAddress = "0xabf16eafac1f269a97935b4e3f7e158b61ead3f3";
        this.BurnAddress = "0x000000000000000000000000000000000000dead";
        this.CommonsBudgetAddress = "0x71D208bfd49375285301343C719e1EA087c87b43";
        this.DWFTransferAddress = "0x12eC499895590898FDf92CA71AcEcCfF33C257C0";

        this.HoledAirdropAddress = [
            "0x2e650da344c6fa949962a139cbde6f411b369aba",
            "0x28fbb415dffc0c7540c4b6688e765cfec7ba24d8",
            "0x0252105a98fdf29d1fbe8cba619d4b8ec07d4c2c",
            "0x631302f2d5d7d41970186023e1a47a7a249fdc14",
            "0xf8c69c2b6731e0ab4072272613c0da9d2881bc4c",
            "0xc9a3b7810a9089716800ff3748ef02659b42b52c",
            "0xd02d41853ad45adce2efce07d5f0982091cf4c6f",
            "0xd62ad9fd3b34813ce5652f04551d6510d09bc75d",
            "0x82394244b86241ef776ccd9948cea0e5dd1f62f8",
            // "0xb18ff7999757fe1e00ced454927b39812f3418aa", MarketingAddress1 로 변경
            "0x02e5633f50d89854c6734cade0c9f1b0dc75ce5e",
        ];

        const BOSAGORA = JSON.parse(fs.readFileSync("./contracts/BOSAGORA.sol/BOSAGORA.json", "utf8"));
        const BOAContractAddress = "0x746DdA2ea243400D5a63e0700F190aB79f06489e";
        this.BOAcontract = new ethers.Contract(BOAContractAddress, BOSAGORA.abi, this.ETHProvider);
    }

    public async onStart() {
        console.log(`On start`);
        await this.work();
    }

    protected override async work() {
        try {
            // Ethereum mainnet
            console.log(`* InitialSupply: ${this.InitialSupply}`);
            const FoundationBalance = BigNumber.from(await this.BOAcontract.balanceOf(this.FoundationAddress));
            console.log(`FoundationBalance: ${FoundationBalance}`);
            const Marketing1Balance = BigNumber.from(await this.BOAcontract.balanceOf(this.MarketingAddress1));
            console.log(`Marketing1Balance: ${Marketing1Balance}`);
            const Marketing2Balance = BigNumber.from(await this.BOAcontract.balanceOf(this.MarketingAddress2));
            console.log(`Marketing2Balance: ${Marketing2Balance}`);
            const BountyBalance = BigNumber.from(await this.BOAcontract.balanceOf(this.BountyAddress));
            console.log(`BountyBalance: ${BountyBalance}`);
            const TeamMemberBalance = BigNumber.from(await this.BOAcontract.balanceOf(this.TeamMemberAddress));
            console.log(`TeamMemberBalance: ${TeamMemberBalance}`);
            const DWFTransferBalance = BigNumber.from(await this.BOAcontract.balanceOf(this.DWFTransferAddress));
            console.log(`DWFTransferBalance: ${DWFTransferBalance}`);
            const BurnedBalance = BigNumber.from(await this.BOAcontract.balanceOf(this.BurnAddress));
            console.log(`BurnedBalance: ${BurnedBalance}`);

            let HoledAirdropBalance: BigNumber = BigNumber.from("0");

            for (const address of this.HoledAirdropAddress) {
                HoledAirdropBalance = HoledAirdropBalance.add(
                    BigNumber.from(await this.BOAcontract.balanceOf(address))
                );
            }
            console.log(`HoledAirdropBalance: ${HoledAirdropBalance}`);

            // Agora mainnet
            let CommonsBudgetBalance = await this.AgoraProvider.getBalance(this.CommonsBudgetAddress);
            CommonsBudgetBalance = CommonsBudgetBalance.div(BigNumber.from(10 ** 11));
            console.log(`CommonsBudgetbalance: ${CommonsBudgetBalance}`);

            // Agora Scan DB
            let RewardBalance = BigNumber.from(await this.getRewardBalance());
            RewardBalance = RewardBalance.div(BigNumber.from(10 ** 2));
            console.log(`RewardBalance: ${RewardBalance}`);

            let TotalSupply = this.InitialSupply.add(RewardBalance).add(CommonsBudgetBalance).sub(BurnedBalance);

            let CirculatingSupply = TotalSupply.sub(
                FoundationBalance.add(Marketing1Balance)
                    .add(Marketing2Balance)
                    .add(BountyBalance)
                    .add(this.BridgeLiquidity)
                    .add(this.BridgeFoundationLiquidity)
                    .add(TeamMemberBalance)
                    .add(HoledAirdropBalance)
                    .add(CommonsBudgetBalance)
                    .add(DWFTransferBalance)
            );

            if (TotalSupply.gte(BigNumber.from(storage.totalSupply))) {
                storage.circulatingSupply = CirculatingSupply.toString();
                storage.totalSupply = TotalSupply.toString();
            }
            console.log(`* Circulating Supply: ${storage.circulatingSupply}`);
            console.log(`* Total Supply: ${storage.totalSupply}`);
        } catch (error) {
            console.log(`Failed to execute the API scheduler ${error}`);
            logger.error(`Failed to execute the API scheduler: ${error}`);
        }
    }

    private async getRewardBalance(): Promise<any> {
        const client: PoolClient = await pool.connect();

        const SQL = "SELECT (SUM(balance) + SUM(withdrawal)) - SUM(balanceactivation) as reward FROM public.validators";
        try {
            const res = await client.query(SQL);
            let reward;
            if (res.rowCount > 0) reward = res.rows[0].reward;
            return reward;
        } catch (err) {
            throw err;
        } finally {
            client.release();
        }
    }
}
