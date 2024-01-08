// ecosystem.config.js
const os = require('os');
module.exports = {
    apps: [{
        port        : 3000,
        name        : "game-server",
        script      : "build/index.js", // your entrypoint file
        instances   : os.cpus().length,
        exec_mode   : 'fork',         // IMPORTANT: do not use cluster mode.
        env: {
            DEBUG: "colyseus:errors",
            NODE_ENV: "production",
            USE_REDIS: true,
            USE_DOMAIN: true,
            BASE_URL: "example.com",
            SUB_DOMAIN_BASE: "game-server-"
        }
    }]
}