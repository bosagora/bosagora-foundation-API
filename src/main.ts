import * as dotenv from "dotenv";
import { APIServer } from "./service/APIServer";
import { logger } from "./service/common/Logger";

let server: APIServer;

async function main() {
    if (process.env.NODE_ENV == "production") {
        console.log("Production Mode");
    } else if (process.env.NODE_ENV == "development") {
        console.log("Development Mode");
    }

    const port = Number(process.env.API_PORT);
    const address = process.env.API_ADDRESS || "";
    server = new APIServer(port, address.toString());
    return server.start().catch((error: any) => {
        switch (error.code) {
            case "EACCES":
                logger.error(`${port} requires elevated privileges`);
                break;
            case "EADDRINUSE":
                logger.error(`Port ${port} is already in use`);
                break;
            default:
                logger.error(`An error occurred while starting the server: ${error.stack}`);
        }
        process.exit(1);
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

process.on("SIGINT", () => {
    server.stop().then(() => {
        process.exit(0);
    });
});
