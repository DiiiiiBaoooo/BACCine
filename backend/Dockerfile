# Sử dụng Node.js LTS version
FROM node:18-slim

# Cài đặt các dependencies cần thiết cho canvas và ffmpeg
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Tạo thư mục làm việc
WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài đặt dependencies
RUN npm ci --only=production

# Copy toàn bộ source code
COPY . .

# Tạo thư mục cần thiết
RUN mkdir -p uploads videos

# Expose port (Cloud Run sẽ set PORT environment variable)
EXPOSE 8080

# Chạy ứng dụng
CMD ["node", "server.js"]