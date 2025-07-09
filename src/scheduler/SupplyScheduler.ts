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

    private InitialSupply = BigNumber.from("4500000000000000");

    private BurnAddress = "0x000000000000000000000000000000000000dead";
    private CommonsBudgetAddress = "0x71D208bfd49375285301343C719e1EA087c87b43";

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
        return new ethers.Contract("0x51bD4f39803fcAEFf3ef45aae2C3aaFf0B9faDcb", abi, this.getETHProvider());
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

        const BurnedBalance = BigNumber.from(await this.getBOATokenContract().balanceOf(this.BurnAddress));
        this.writeBalance("  BurnedBalance", BurnedBalance);
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

        const TotalSupply = BigNumber.from(await this.getBOATokenContract().totalSupply()).sub(BurnedBalance);
        if (this.isTerminating()) {
            logger.info("Terminated");
            return;
        }

        const CirculatingSupply = this.InitialSupply.add(RewardBalance).sub(BurnedBalance);

        await this.supply_storage.postSupply({
            initial_supply: this.InitialSupply.toBigInt(),
            burned: BurnedBalance.toBigInt(),
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
