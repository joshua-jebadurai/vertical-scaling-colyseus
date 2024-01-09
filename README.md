
## Vertical Scaling Strategy
#### Docker Compose + HAProxy + PM2 + Redis + [Colyseus](https://colyseus.io)

This project was aimed for staging and test scalability on a single machine with multiple cores. The objective is to avoid setting up VMs with all these tools.

Look at [Colyseus Scalability](https://docs.colyseus.io/scalability/).

For production, [Colyseus Cloud](https://cloud-prod.colyseus.io) is highly recommended.

#### Usage
##### Requirements

- Public domain (*.example.com)
- VMs (Linux and Mac)


##### Setting up server and DNS
- Create a VM/Server, [install docker](https://docs.docker.com/engine/install/) and docker compose plugin.
- Make sure port 80/443 is open on firewall.
- Update domain's DNS manager, create an A record (preferable wildcard sub-domain) that's pointing to the server's public IP address. (*.example.com) -> ipaddress

##### Modifying files

- `ecosystem.config.js`: change the `BASE_URL` to your domain name (example.com), also the `SUB_DOMAIN_BASE` to the game server prefix (game-server-). Game server domains will look like (game-server-1.example.com, game-server-2.example.com).
```
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
```

- `haproxy/haproxy.cfg`: based on how many cores the server has, add `acl` entries and map them to `backend`. Number of cores = number of subdomains.
```
frontend http
  bind *:80
  mode http
  # Entry point, distributes traffic to all the backends
  acl host_gameserver_0 hdr(host) -i game-server.example.com

  # These domains is for Colyseus to redirect as per public domain to process
  acl host_gameserver_1 hdr(host) -i game-server-1.example.com
  acl host_gameserver_2 hdr(host) -i game-server-2.example.com
  
  # Conditions to use what backend based on hostname
  use_backend game_server_0 if host_gameserver_0
  use_backend game_server_1 if host_gameserver_1
  use_backend game_server_2 if host_gameserver_2


# Entry point backend
backend game_server_0
  mode http
  # Try the other routing methods as well
  # leastconn, static-rr, source, first, random
  balance roundrobin
  server game_server_1 game-servers:3000 check
  server game_server_2 game-servers:3001 check

backend game_server_1
  mode http
  balance roundrobin
  server game_server_1 game-servers:3000 check

backend game_server_2
  mode http
  balance roundrobin
  server game_server_2 game-servers:3001 check
```
- `docker-compose.yml`: by default, ports 3000-3007 are exposed, modify them based on how many cores the server has.
```
  game-servers:
    image: "game-server:latest"
    hostname: game-servers
    depends_on:
      - redis
    ports:
      - 3000-3007:3000-3007
```

- `DockerFile`: by default, ports 3000-3007 are exposed, modify them based on how many cores the server has. `EXPOSE 3000-3007`

##### Deploying

Run the included shell file to deploy vertical scaled build.
`./docker-build.sh`

##### SSL
Using load-balancer with SSL and pointing A records to that ip-address is the recommended way. 

Optionally, modify the `haproxy/haproxy.cfg` to redirect all 80 port traffic to 443 port
```
frontend http
  bind *:80
  mode http
  redirect scheme https if !{ ssl_fc }

frontend https
  bind *:443 ssl crt /etc/haproxy/certs/cert.pem
  mode http
  # Entry point, distributes traffic to all the backends
  acl host_gameserver_0 hdr(host) -i game-server.example.com

  # These domains is for Colyseus to redirect as per public domain to process
  acl host_gameserver_1 hdr(host) -i game-server-1.example.com
  acl host_gameserver_2 hdr(host) -i game-server-2.example.com
  
  # Conditions to use what backend based on hostname
  use_backend game_server_0 if host_gameserver_0
  use_backend game_server_1 if host_gameserver_1
  use_backend game_server_2 if host_gameserver_2
```

Modify the `docker-compose.yml`, and add the certificates in `/haproxy/certs/`
```
  haproxy:
    image: haproxy:latest
    depends_on:
      - game-servers
      - redis
    volumes:
      - ./haproxy:/usr/local/etc/haproxy
      - ./haproxy/certs:/etc/haproxy/certs
    ports:
      - "80:80"
      - "443:443"
```
