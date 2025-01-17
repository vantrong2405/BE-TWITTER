# Hướng dẫn Docker

```bash
# Build Image
# Cú pháp:
docker build [OPTIONS] -t [IMAGE_NAME:TAG] -f [DOCKERFILE_PATH] .

# Ví dụ:
docker build --progress=plain -t doanvovantrong/twitter:v0 -f Dockerfile.dev .

# Run Image
# Cú pháp:
docker container run [OPTIONS] [IMAGE_NAME:TAG]

# Ví dụ:
docker container run -dp 4000:4000 doanvovantrong/twitter:v0

# Truy cập vào terminal của container
# Cú pháp:
docker exec -it [CONTAINER_ID|CONTAINER_NAME] [COMMAND]

# Ví dụ:
docker exec -it c1234567890a sh

# Volumes Mapping
# Cú pháp:
docker container run [OPTIONS] -v [LOCAL_PATH]:[CONTAINER_PATH] [IMAGE_NAME:TAG]

# Ví dụ:
docker container run -dp 4000:4000 -v D:/Learning/Nodejs/uploads:/app/uploads doanvovantrong/twitter:v0

# Docker Compose
# Cú pháp:
docker compose up [OPTIONS]

# Ví dụ:
docker compose up

# Push Code Lên Docker Hub
# Cú pháp:
docker tag [LOCAL_IMAGE:TAG] [REPOSITORY:TAG]
docker push [REPOSITORY:TAG]

# Ví dụ:
docker tag doanvovantrong/twitter:v0 doanvovantrong/twitter:v0
docker push doanvovantrong/twitter:v0

# Xem danh sách image
# Cú pháp:
docker image ls

# Ví dụ:
docker image ls

# Pull Image từ Docker Hub
# Cú pháp:
docker pull [REPOSITORY:TAG]

# Ví dụ:
docker pull doanvovantrong/twitter:v0

# Remove Container
# Cú pháp:
docker container rm [CONTAINER_ID|CONTAINER_NAME]

# Ví dụ:
docker container rm c1234567890a

# Remove Running Container
# Cú pháp:
docker container rm -f [CONTAINER_ID|CONTAINER_NAME]

# Ví dụ:
docker container rm -f c1234567890a

# Remove Image
# Cú pháp:
docker image rm [IMAGE_ID|IMAGE_NAME:TAG]

# Ví dụ:
docker image rm doanvovantrong/twitter:v0
