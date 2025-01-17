import { Amount } from "../common/Amount";
import { Config } from "../common/Config";
import { logger } from "../common/Logger";
import { Metrics } from "../metrics/Metrics";
import { WebService } from "../service/WebService";
import { SupplyStorage } from "../storage/SupplyStorage";

import express from "express";

import { BigNumber } from "ethers";

export class DefaultRouter {
    private _web_service: WebService;
    private readonly _config: Config;
    private readonly _metrics: Metrics;
    private readonly _storage: SupplyStorage;

    constructor(service: WebService, config: Config, metrics: Metrics, storage: SupplyStorage) {
        this._web_service = service;
        this._config = config;
        this._metrics = metrics;
        this._storage = storage;
    }

    private get app(): express.Application {
        return this._web_service.app;
    }

    public makeResponseData(code: number, data: any, error?: any): any {
        return {
            code,
            data,
            error,
        };
    }

    public registerRoutes() {
        this.app.get("/", [], this.getHealthStatus.bind(this));
        this.app.get("/metrics", [], this.getMetrics.bind(this));
        this.app.get("/circulatingsupply", [], this.getCirculatingSupply.bind(this));
        this.app.get("/totalsupply", [], this.getTotalSupply.bind(this));
        this.app.get("/detail", [], this.getDetail.bind(this));
    }

    private async getHealthStatus(req: express.Request, res: express.Response) {
        return res.status(200).json("OK");
    }

    private async getMetrics(req: express.Request, res: express.Response) {
        res.set("Content-Type", this._metrics.contentType());
        this._metrics.add("status", 1);
        res.end(await this._metrics.metrics());
    }

    private async getCirculatingSupply(req: express.Request, res: express.Response) {
        logger.http(`GET /circulatingsupply`);

        try {
            const items = await this._storage.getSupply();
            if (items.length > 0) {
                const circulatingSupply = new Amount(BigNumber.from(items[0].circulating_supply), 7);
                return res.status(200).send(circulatingSupply.toBOAString());
            } else {
                return res.status(500).send("Failed to get the circulating supply information.");
            }
        } catch (error: any) {
            logger.error("GET /circulatingsupply , " + error);
            return res.status(500).send("Failed to get the circulating supply information.");
        }
    }

    private async getTotalSupply(req: express.Request, res: express.Response) {
        logger.http(`GET /totalsupply`);

        try {
            const items = await this._storage.getSupply();
            if (items.length > 0) {
                const totalSupply = new Amount(BigNumber.from(items[0].total_supply), 7);
                return res.status(200).send(totalSupply.toBOAString());
            } else {
                return res.status(500).send("Failed to get the total supply information.");
            }
        } catch (error: any) {
            logger.error("GET /totalsupply , " + error);
            return res.status(500).send("Failed to get the total supply information.");
        }
    }

    private async getDetail(req: express.Request, res: express.Response) {
        logger.http(`GET /detail`);

        try {
            const items = await this._storage.getSupply();
            if (items.length > 0) {
                return res.status(200).json({
                    initial_supply: {
                        address: "",
                        balance: new Amount(BigNumber.from(items[0].initial_supply), 7).toBOAString(),
                    },
                    foundation: {
                        address: "0x2529379ac2c209058adf4c28f2c963878ea5e7bd",
                        balance: new Amount(BigNumber.from(items[0].foundation), 7).toBOAString(),
                    },
                    marketing1: {
                        address: "0x8f4FCe6B4a7a16CEDb8Eb8fCd732360AA310853a",
                        balance: new Amount(BigNumber.from(items[0].marketing1), 7).toBOAString(),
                    },
                    marketing2: {
                        address: "0x4327bb17a6408d8ff94c7be88c20c521ad85d6d7",
                        balance: new Amount(BigNumber.from(items[0].marketing2), 7).toBOAString(),
                    },
                    bounty: {
                        address: "0x30e5794f87003b15a40827be2cc1c2ae4bc79435",
                        balance: new Amount(BigNumber.from(items[0].bounty), 7).toBOAString(),
                    },
                    team_member: {
                        address: "0xabf16eafac1f269a97935b4e3f7e158b61ead3f3",
                        balance: new Amount(BigNumber.from(items[0].team_member), 7).toBOAString(),
                    },
                    bridge_liquidity: {
                        address: "",
                        balance: 0,
                    },
                    dwf: {
                        address: "0x12eC499895590898FDf92CA71AcEcCfF33C257C0",
                        balance: new Amount(BigNumber.from(items[0].dwf), 7).toBOAString(),
                    },
                    hold_airdrop: {
                        address: [
                            "0x2e650da344c6fa949962a139cbde6f411b369aba",
                            "0x28fbb415dffc0c7540c4b6688e765cfec7ba24d8",
                            "0x0252105a98fdf29d1fbe8cba619d4b8ec07d4c2c",
                            "0x631302f2d5d7d41970186023e1a47a7a249fdc14",
                            "0xf8c69c2b6731e0ab4072272613c0da9d2881bc4c",
                            "0xc9a3b7810a9089716800ff3748ef02659b42b52c",
                            "0xd02d41853ad45adce2efce07d5f0982091cf4c6f",
                            "0xd62ad9fd3b34813ce5652f04551d6510d09bc75d",
                            "0x82394244b86241ef776ccd9948cea0e5dd1f62f8",
                            "0x02e5633f50d89854c6734cade0c9f1b0dc75ce5e",
                        ],
                        balance: new Amount(BigNumber.from(items[0].hold_airdrop), 7).toBOAString(),
                    },
                    burned: {
                        address: "0x000000000000000000000000000000000000dead",
                        balance: new Amount(BigNumber.from(items[0].burned), 7).toBOAString(),
                    },
                    commons_budget: {
                        address: "0x71D208bfd49375285301343C719e1EA087c87b43",
                        balance: new Amount(BigNumber.from(items[0].commons_budget), 7).toBOAString(),
                    },
                    reward: {
                        address: "",
                        balance: new Amount(BigNumber.from(items[0].reward), 7).toBOAString(),
                    },
                    circulating_supply: {
                        address: "",
                        balance: new Amount(BigNumber.from(items[0].circulating_supply), 7).toBOAString(),
                    },
                    total_supply: {
                        address: "",
                        balance: new Amount(BigNumber.from(items[0].total_supply), 7).toBOAString(),
                    },
                });
            } else {
                return res.status(500).send("Failed to get the detailed information.");
            }
        } catch (error: any) {
            logger.error("GET /detail , " + error);
            return res.status(500).send("Failed to get the detailed information.");
        }
    }
}
