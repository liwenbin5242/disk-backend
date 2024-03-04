FROM node:14
# Create app directory
WORKDIR /usr/src/disk-backend

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3101
CMD ["node","./bin/www"]