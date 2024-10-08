FROM node:18-alpine

# Korean Timezone Setting
ADD https://worldtimeapi.org/api/timezone/Asia/Seoul /tmp/bustcache

WORKDIR /app

COPY nest-cli.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY .env ./

RUN apk update
RUN apk upgrade
RUN apk add --no-cache udev ttf-freefont chromium

ENV LANG=ko_KR.UTF-8
ENV LANGUAGE=ko_KR.UTF-

# package.json, package-lock.json
COPY package*.json ./
RUN npm install

COPY src ./src
RUN npm run build

ENTRYPOINT [ "node" ]
CMD ["dist/main.js"]