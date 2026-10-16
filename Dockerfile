# ==========================================
# STAGE 1: Build da aplicação NestJS + Prisma
# ==========================================
FROM node:22-bookworm-slim AS builder

# Instala OpenSSL (necessário para o Prisma Engine)
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia arquivos de dependências e schema do Prisma primeiro (aproveita cache de camadas do Docker)
COPY package.json package-lock.json* .npmrc* ./
COPY prisma ./prisma/

# Instala todas as dependências (incluindo devDependencies para o build) e gera o Prisma Client
RUN npm install --legacy-peer-deps
RUN npx prisma generate

# Copia o restante do código-fonte e compila o projeto TypeScript -> JavaScript (dist/)
COPY . .
RUN npm run build

# Remove devDependencies mantendo apenas pacotes de produção e o Prisma Client gerado
RUN npm prune --omit=dev --legacy-peer-deps

# ==========================================
# STAGE 2: Imagem final enxuta de Produção
# ==========================================
FROM node:22-bookworm-slim AS runner

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3333

# Copia apenas os artefatos necessários do stage builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Garante que a pasta de fallback de uploads exista
RUN mkdir -p /app/uploads/avatars

EXPOSE 3333

CMD ["node", "dist/main.js"]
