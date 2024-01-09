git pull
docker build -t game-server .
docker rm -f game-server
docker compose up -d