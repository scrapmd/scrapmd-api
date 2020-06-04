FROM node:14 as builder

WORKDIR /app
COPY . .
RUN yarn install
RUN yarn build

FROM node:14 as runner
WORKDIR /app

COPY --from=builder /app/out /app/out
COPY . .
RUN yarn install --production

ENTRYPOINT ["yarn"]
CMD ["start"]
