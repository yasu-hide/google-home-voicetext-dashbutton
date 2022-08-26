FROM node:16.17.0-bullseye-slim as builder
WORKDIR /tmp
RUN apt-get update \
    && apt-get install -y git python build-essential libpcap-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
COPY package.json /tmp/package.json
RUN npm config set unsafe-perm true \
    && npm update -y -g npm \
    && npm install; exit 0 \
    && npm config set unsafe-perm false

FROM node:16.17.0-bullseye-slim
WORKDIR /tmp
RUN apt-get update \
    && apt-get install -y libpcap-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
COPY package.json /tmp/package.json
COPY --from=builder /tmp/node_modules /tmp/node_modules
COPY main.js /tmp/main.js
COPY dashbutton.json /tmp/dashbutton.json
ENTRYPOINT ["node"]
CMD ["/tmp/main.js"]