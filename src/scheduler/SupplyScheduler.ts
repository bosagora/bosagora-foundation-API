import { Config } from "../common/Config";
import { logger } from "../common/Logger";
import { Metrics } from "../metrics/Metrics";
import { AgoraScanStorage } from "../storage/AgoraScanStorage";
import { SupplyStorage } from "../storage/SupplyStorage";
import { Scheduler, ScheduleState } from "./Scheduler";

import { BigNumber, ethers } from "ethers";
import fs from "fs";

export class SupplyScheduler extends Scheduler {
    private _config: Config | undefined;
    private _agora_scan_storage: AgoraScanStorage | undefined;
    private _supply_storage: SupplyStorage | undefined;
    private _metrics: Metrics | undefined;

    private InitialSupply = BigNumber.from("5421301301958463");
    private BridgeFoundationLiquidity = BigNumber.from("400000000000000");
    private BridgeLiquidity = BigNumber.from("10000000000000");

    private FoundationAddress = "0x2529379ac2c209058adf4c28f2c963878ea5e7bd";
    private MarketingAddress1 = "0x8f4FCe6B4a7a16CEDb8Eb8fCd732360AA310853a";
    private MarketingAddress2 = "0x4327bb17a6408d8ff94c7be88c20c521ad85d6d7";
    private BountyAddress = "0x30e5794f87003b15a40827be2cc1c2ae4bc79435";
    private TeamMemberAddress = "0xabf16eafac1f269a97935b4e3f7e158b61ead3f3";
    private BurnAddress = "0x000000000000000000000000000000000000dead";
    private CommonsBudgetAddress = "0x71D208bfd49375285301343C719e1EA087c87b43";
    private DWFTransferAddress = "0x12eC499895590898FDf92CA71AcEcCfF33C257C0";

    private HoledAirdropAddress = [
        "0x2e650da344c6fa949962a139cbde6f411b369aba",
        "0x28fbb415dffc0c7540c4b6688e765cfec7ba24d8",
        "0x0252105a98fdf29d1fbe8cba619d4b8ec07d4c2c",
        "0x631302f2d5d7d41970186023e1a47a7a249fdc14",
        "0xf8c69c2b6731e0ab4072272613c0da9d2881bc4c",
        "0xc9a3b7810a9089716800ff3748ef02659b42b52c",
        "0xd02d41853ad45adce2efce07d5f0982091cf4c6f",
        "0xd62ad9fd3b34813ce5652f04551d6510d09bc75d",
        "0x82394244b86241ef776ccd9948cea0e5dd1f62f8",
        // "0x8f4FCe6B4a7a16CEDb8Eb8fCd732360AA310853a", MarketingAddress1 로 변경
        "0x02e5633f50d89854c6734cade0c9f1b0dc75ce5e",
    ];

    constructor(expression: string) {
        super(expression);
    }

    private get config(): Config {
        if (this._config !== undefined) return this._config;
        else {
            logger.error("Config is not ready yet.");
            process.exit(1);
        }
    }

    private get metrics(): Metrics {
        if (this._metrics !== undefined) return this._metrics;
        else {
            logger.error("Metrics is not ready yet.");
            process.exit(1);
        }
    }

    private get agora_scan_storage(): AgoraScanStorage {
        if (this._agora_scan_storage !== undefined) return this._agora_scan_storage;
        else {
            logger.error("Storage is not ready yet.");
            process.exit(1);
        }
    }

    private get supply_storage(): SupplyStorage {
        if (this._supply_storage !== undefined) return this._supply_storage;
        else {
            logger.error("Storage is not ready yet.");
            process.exit(1);
        }
    }

    public setOption(options: any) {
        if (options) {
            if (options.config && options.config instanceof Config) this._config = options.config;
            if (options.agora_scan_storage && options.agora_scan_storage instanceof AgoraScanStorage)
                this._agora_scan_storage = options.agora_scan_storage;
            if (options.supply_storage && options.supply_storage instanceof SupplyStorage)
                this._supply_storage = options.supply_storage;
            if (options.metrics && options.metrics instanceof Metrics) this._metrics = options.metrics;
        }
    }

    private getETHProvider(): ethers.providers.JsonRpcProvider {
        return new ethers.providers.JsonRpcProvider(this.config.setting.ethRpcUrl);
    }

    private getBOAProvider(): ethers.providers.JsonRpcProvider {
        return new ethers.providers.JsonRpcProvider(this.config.setting.boaRpcUrl);
    }

    private getBOATokenContract(): ethers.Contract {
        const abi = JSON.parse(fs.readFileSync("./src/abi/ERC20.json", "utf8"));
        return new ethers.Contract("0x746DdA2ea243400D5a63e0700F190aB79f06489e", abi, this.getETHProvider());
    }

    public async onStart() {
        //
    }

    protected async work() {
        try {
            await this.onScan();
        } catch (error) {
            logger.error(`Failed to execute the SupplyScheduler: ${error}`);
        }
    }

    private isTerminating(): boolean {
        return this.state === ScheduleState.STOPPING || this.state === ScheduleState.STOPPED;
    }

    private async onScan() {
        // Ethereum mainnet
        this.writeBalance("* InitialSupply", this.InitialSupply);

        const FoundationBalance = BigNumber.from(await this.getBOATokenContract().balanceOf(this.FoundationAddress));
        this.writeBalance("  FoundationBalance", FoundationBalance);
        if (this.isTerminating()) {
            logger.info("Terminated");
            return;
        }

        const Marketing1Balance = BigNumber.from(await this.getBOATokenContract().balanceOf(this.MarketingAddress1));
        this.writeBalance("  Marketing1Balance", Marketing1Balance);
        if (this.isTerminating()) {
            logger.info("Terminated");
            return;
        }

        const Marketing2Balance = BigNumber.from(await this.getBOATokenContract().balanceOf(this.MarketingAddress2));
        this.writeBalance("  Marketing2Balance", Marketing2Balance);
        if (this.isTerminating()) {
            logger.info("Terminated");
            return;
        }

        const BountyBalance = BigNumber.from(await this.getBOATokenContract().balanceOf(this.BountyAddress));
        this.writeBalance("  BountyBalance", BountyBalance);
        if (this.isTerminating()) {
            logger.info("Terminated");
            return;
        }

        const TeamMemberBalance = BigNumber.from(await this.getBOATokenContract().balanceOf(this.TeamMemberAddress));
        this.writeBalance("  TeamMemberBalance", TeamMemberBalance);
        if (this.isTerminating()) {
            logger.info("Terminated");
            return;
        }

        const DWFTransferBalance = BigNumber.from(await this.getBOATokenContract().balanceOf(this.DWFTransferAddress));
        this.writeBalance("  DWFTransferBalance", DWFTransferBalance);
        if (this.isTerminating()) {
            logger.info("Terminated");
            return;
        }

        const BurnedBalance = BigNumber.from(await this.getBOATokenContract().balanceOf(this.BurnAddress));
        this.writeBalance("  BurnedBalance", BurnedBalance);
        if (this.isTerminating()) {
            logger.info("Terminated");
            return;
        }

        let HoledAirdropBalance: BigNumber = BigNumber.from("0");
        for (const address of this.HoledAirdropAddress) {
            HoledAirdropBalance = HoledAirdropBalance.add(
                BigNumber.from(await this.getBOATokenContract().balanceOf(address))
            );
        }
        this.writeBalance("  HoledAirdropBalance", HoledAirdropBalance);
        if (this.isTerminating()) {
            logger.info("Terminated");
            return;
        }

        // Agora mainnet
        let CommonsBudgetBalance = await this.getBOAProvider().getBalance(this.CommonsBudgetAddress);
        CommonsBudgetBalance = CommonsBudgetBalance.div(BigNumber.from(10 ** 11));
        this.writeBalance("  CommonsBudgetBalance", CommonsBudgetBalance);
        if (this.isTerminating()) {
            logger.info("Terminated");
            return;
        }

        // Agora Scan DB
        let RewardBalance = await this.agora_scan_storage.getReward();
        RewardBalance = RewardBalance.div(BigNumber.from(10 ** 2));
        this.writeBalance("  RewardBalance", RewardBalance);
        if (this.isTerminating()) {
            logger.info("Terminated");
            return;
        }

        const TotalSupply = this.InitialSupply.add(RewardBalance).add(CommonsBudgetBalance).sub(BurnedBalance);
        if (this.isTerminating()) {
            logger.info("Terminated");
            return;
        }

        const CirculatingSupply = TotalSupply.sub(
            FoundationBalance.add(Marketing2Balance)
                .add(BountyBalance)
                // .add(this.BridgeLiquidity)
                // .add(this.BridgeFoundationLiquidity)
                .add(TeamMemberBalance)
                .add(HoledAirdropBalance)
                .add(CommonsBudgetBalance)
                .add(DWFTransferBalance)
        );

        await this.supply_storage.postSupply({
            initial_supply: this.InitialSupply.toBigInt(),
            burned: BurnedBalance.toBigInt(),
            foundation: FoundationBalance.toBigInt(),
            marketing1: Marketing1Balance.toBigInt(),
            marketing2: Marketing2Balance.toBigInt(),
            bounty: BountyBalance.toBigInt(),
            team_member: TeamMemberBalance.toBigInt(),
            dwf: DWFTransferBalance.toBigInt(),
            hold_airdrop: HoledAirdropBalance.toBigInt(),
            reward: RewardBalance.toBigInt(),
            commons_budget: CommonsBudgetBalance.toBigInt(),
            total_supply: TotalSupply.toBigInt(),
            circulating_supply: CirculatingSupply.toBigInt(),
        });

        this.writeBalance("* Circulating Supply", CirculatingSupply);
        this.writeBalance("* Total Supply", TotalSupply);

        await this.supply_storage.removeOver30Days();
        logger.info("///////////////////////////////////////////////////////");
    }

    private writeBalance(title: string, value: BigNumber) {
        logger.info(`${(title + " ").padEnd(32, "-")} : ${value.toString().padStart(20, " ")}`);
    }
}
