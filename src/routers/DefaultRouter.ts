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
                    bridge_liquidity: {
                        address: "",
                        balance: 0,
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
