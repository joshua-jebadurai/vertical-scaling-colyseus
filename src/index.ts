import { Server, ServerOptions, matchMaker } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { RedisDriver, RedisPresence } from "colyseus";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { MyRoom } from "./rooms/MyRoom";
import gameRouter from "./routes";

const INSTANCE = Number(process.env.NODE_APP_INSTANCE) || 0;
const PORT = ((Number(process.env.PORT)) + INSTANCE) || 3000;

const USE_REDIS = (process.env.USE_REDIS === "true") || false;
const USE_DOMAIN = (process.env.USE_DOMAIN === "true") || false;

const BASE_URL = process.env.BASE_URL || 'example.com';
const SUB_DOMAIN_BASE = process.env.SUB_DOMAIN_BASE || 'process-';

const app = express();
const server = createServer(app); // create the http server manually

const publicAddress = `${SUB_DOMAIN_BASE}${INSTANCE + 1}.${BASE_URL}`;

const serverOptions: ServerOptions = {
    transport: new WebSocketTransport({ server }),
    // publicAddress: publicAddress
}

if (USE_REDIS) {
    console.log ("Using Redis");
    serverOptions.publicAddress = publicAddress;
    serverOptions.presence = new RedisPresence("redis://redis:6379");
    serverOptions.driver = new RedisDriver("redis://redis:6379");
}

const gameServer = new Server(serverOptions);

gameServer.define('my-room', MyRoom);

app.use(express.json());
app.use(cors());
app.use('/', gameRouter); 


console.log('publicAddress: ', `${publicAddress} (${USE_DOMAIN})`, 'internal port: ', PORT, 'REDIS', USE_REDIS);

gameServer.onShutdown(() => {
    console.log("shutting down");
});

gameServer.listen(PORT);