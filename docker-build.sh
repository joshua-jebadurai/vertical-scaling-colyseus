# git pull
docker build -t game-server .
docker rm -f game-server
# docker run --name tombola-server -dp 3000-3008:3000-3008 tombola-server
docker compose up -d