/**
 *  The web server of APIServer
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import bodyParser from "body-parser";
import cors from "cors";
import { SupplyAPIScheduler } from "../service/schedulers/SupplyAPIScheduler";
import { WebService } from "../modules/service/WebService";
import { cors_options } from "./option/cors";
import { SupplyRouter } from "./routers/SupplyRouter";

export class APIServer extends WebService {
    public readonly supplyAPIScheduler: SupplyAPIScheduler;

    public readonly supplyRouter: SupplyRouter;
    /**
     * Constructor
     * @param config Configuration
     * @param schedules Array of IScheduler
     */
    constructor(port: number, address: string) {
        super(port, address);
        this.supplyAPIScheduler = new SupplyAPIScheduler();
        this.supplyRouter = new SupplyRouter(this);
    }

    /**
     * Setup and start the server
     */
    public async start(): Promise<void> {
        this.app.use(bodyParser.urlencoded({ extended: false, limit: "1mb" }));
        this.app.use(bodyParser.json({ limit: "1mb" }));
        this.app.use(cors(cors_options));
        await this.supplyAPIScheduler.start();
        this.supplyRouter.registerRoutes();
        return super.start();
    }

    public stop(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            await this.supplyAPIScheduler.stop();
            await this.supplyAPIScheduler.waitForStop();
            if (this.server != null) {
                this.server.close((err?) => {
                    if (err) reject(err);
                    else resolve();
                });
            } else resolve();
        });
    }
}
