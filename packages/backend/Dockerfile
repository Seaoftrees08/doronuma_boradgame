FROM node:20-slim AS builder

WORKDIR /app
# ワークスペース全体の package.json をコピー
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/

# 依存関係をインストール
RUN npm ci

# ソースコードをコピーしてビルド
COPY packages/shared packages/shared
COPY packages/backend packages/backend

RUN npm run build --workspace=@doronuma/shared
RUN npm run build --workspace=@doronuma/backend

FROM node:20-slim AS runner
WORKDIR /app
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/backend/package.json ./packages/backend/

# production 用にインストール
RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["npm", "start", "--workspace=@doronuma/backend"]
