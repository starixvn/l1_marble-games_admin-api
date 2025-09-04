FROM hub.lumigame.com/docker-hub/library/node:24-alpine@sha256:be4d5e92ac68483ec71440bf5934865b4b7fcb93588f17a24d411d15f0204e4f AS builder
WORKDIR /app
COPY package.json yarn.lock .modprunerrc ./
RUN npm run reg \
    && yarn install
COPY . .
RUN npm run build
RUN rm -rf ./node_modules
RUN yarn install --production \
    && npx mod-pruner prune --force 


FROM hub.lumigame.com/docker-hub/library/node:24-alpine@sha256:be4d5e92ac68483ec71440bf5934865b4b7fcb93588f17a24d411d15f0204e4f
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
RUN mkdir /app && chown node:node /app
WORKDIR /app

RUN apk --no-cache add curl

USER node
ENV PATH=/app/node_modules/.bin:$PATH
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/.env ./

CMD [ "yarn", "start:prod" ]