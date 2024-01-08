import { monitor } from "@colyseus/monitor";
import { Router } from "express";

const createError = require('http-errors')

const gameRouter = Router();

gameRouter.use('/colyseus-monitor', monitor());

gameRouter.get('/', (req, res, next) => {
    res.send(`Game Server - ProcessId: ${process.pid}`);
});

export default gameRouter;