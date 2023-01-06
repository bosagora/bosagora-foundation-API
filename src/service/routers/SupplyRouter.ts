/**
 *  The router of Supply API
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { BigNumber } from "ethers";
import express from "express";
import { WebService } from "../../modules/service/WebService";
import { Amount } from "../common/Amount";
import { logger } from "../common/Logger";
import storage from "../storage/Storage";

export class SupplyRouter {
    /**
     *
     * @private
     */
    private _web_service: WebService;

    /**
     *
     * @param service  WebService
     */
    constructor(service: WebService) {
        this._web_service = service;
    }

    private get app(): express.Application {
        return this._web_service.app;
    }

    /**
     * Make the response data
     * @param code      The result code
     * @param data      The result data
     * @param error     The error
     * @private
     */
    private static makeResponseData(code: number, data: any, error?: any): any {
        return {
            code,
            data,
            error,
        };
    }

    public registerRoutes() {
        this.app.get("/", [], this.getHealthStatus.bind(this));
        this.app.get("/totalsupply", [], this.getTotalSupply.bind(this));
        this.app.get("/circulatingsupply", [], this.getCirculatingSupply.bind(this));
    }

    private async getHealthStatus(req: express.Request, res: express.Response) {
        return res.json("OK");
    }

    /**
     * GET /totalsupply
     * @private
     */
    private async getTotalSupply(req: express.Request, res: express.Response) {
        logger.http(`GET /totalsupply`);

        try {
            const totalSupply = new Amount(BigNumber.from(storage.totalSupply), 7);
            return res.status(200).send(totalSupply.toBOAString());
        } catch (error) {
            logger.error("GET /totalsupply , " + error);
            return res.status(500).json(
                SupplyRouter.makeResponseData(500, undefined, {
                    msg: "Failed to get the totalsupply information.",
                })
            );
        }
    }

    /**
     * GET /circulatingsupply
     * @private
     */
    private async getCirculatingSupply(req: express.Request, res: express.Response) {
        logger.http(`GET /circulatingsupply`);

        try {
            const circulatingSupply = new Amount(BigNumber.from(storage.circulatingSupply), 7);
            return res.status(200).send(circulatingSupply.toBOAString());
        } catch (error) {
            logger.error("GET /circulatingsupply , " + error);
            return res.status(500).json(
                SupplyRouter.makeResponseData(500, undefined, {
                    msg: "Failed to get the circulating supply information.",
                })
            );
        }
    }
}
