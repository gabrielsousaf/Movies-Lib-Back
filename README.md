# 🎬 Movies-Lib API (Backend REST)

API REST completa e escalável para a plataforma **Movies-Lib**, construída com **NestJS**, **TypeScript**, **Prisma ORM**, **PostgreSQL** em nuvem e documentação interativa com **Swagger**.

---

## 🛠️ Tecnologias e Bibliotecas

- **Framework:** [NestJS 12](https://nestjs.com/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **ORM & Banco:** [Prisma ORM](https://www.prisma.io/) com **PostgreSQL** gerenciado em nuvem (Supabase / Neon)
- **Autenticação:** [Passport](http://www.passportjs.org/) + JWT (`@nestjs/jwt`, `passport-jwt`) com criptografia `bcrypt`
- **Validação:** `class-validator` e `class-transformer` com `ValidationPipe` global
- **Documentação de Rotas:** [Swagger / OpenAPI](https://swagger.io/) em `/api/docs`
- **Catálogo Externo:** Integração completa com a API do [The Movie Database (TMDB)](https://www.themoviedb.org/)
- **Testes & Qualidade:** [Vitest](https://vitest.dev/) para testes unitários e [Oxlint](https://oxc.rs/) para linting ultrarrápido

---

## 🚀 Como Executar

### 1. Instalar dependências:
```bash
npm install
```

### 2. Sincronizar o Banco com o Prisma:
```bash
npx prisma db push
# ou executar migrações:
npx prisma migrate dev
```

### 3. Rodar em modo de desenvolvimento:
```bash
npm run start:dev
```

A API estará disponível em: `http://localhost:3333`  
Documentação interativa Swagger: `http://localhost:3333/api/docs`

### 4. Rodar testes e linter:
```bash
# Executar testes unitários
npm run test

# Executar linter
npm run lint

# Compilar para produção
npm run build
```

---

## 📚 Endpoints da API

### 🔐 Autenticação (`/auth`)
| Método | Rota | Proteção | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Pública | Cadastra usuário com validações e hash `bcrypt` |
| `POST` | `/auth/login` | Pública | Autentica e devolve o Token JWT e dados do perfil |
| `GET` | `/auth/me` | JWT | Retorna o perfil do usuário atualmente autenticado |

### 👤 Usuários & Perfis (`/users`)
| Método | Rota | Proteção | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/:username` | Pública | Perfil público e contagem de favoritos, watchlist e reviews |
| `GET` | `/users/:username/favorites` | Opcional | Lista favoritos do usuário (se público ou se for o próprio dono) |
| `PATCH` | `/users/me` | JWT | Atualiza dados cadastrais, bio, avatar e visibilidade (`isPublic`) |
| `PATCH` | `/users/me/password` | JWT | Altera a senha do usuário autenticado |
| `DELETE` | `/users/me` | JWT | Exclui definitivamente a conta e todos os dados associados em cascata |

### ❤️ Favoritos (`/favorites`)
| Método | Rota | Proteção | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/favorites` | JWT | Adiciona título aos favoritos |
| `DELETE` | `/favorites/:tmdbId?type=MOVIE` | JWT | Remove título dos favoritos |
| `GET` | `/favorites/me?type=MOVIE&page=1&limit=20` | JWT | Lista favoritos do usuário logado (com paginação) |
| `GET` | `/favorites/check/:tmdbId?type=MOVIE` | JWT | Informa se o título já está favoritado (`{ isFavorite: boolean }`) |

### 📌 Watchlist: Quero Assistir & Já Assisti (`/watchlist`)
| Método | Rota | Proteção | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/watchlist` | JWT | Salva ou atualiza item como `WATCHLIST` (Quero Assistir) ou `WATCHED` (Já Assisti) |
| `PATCH` | `/watchlist/:tmdbId/status?type=MOVIE` | JWT | Altera o status entre `WATCHLIST` e `WATCHED` |
| `DELETE` | `/watchlist/:tmdbId?type=MOVIE` | JWT | Remove item da watchlist |
| `GET` | `/watchlist/me?status=WATCHLIST&type=MOVIE&page=1&limit=20` | JWT | Lista meus itens por status com paginação |
| `GET` | `/watchlist/check/:tmdbId?type=MOVIE` | JWT | Verifica status atual (`{ inList: boolean, status: string }`) |
| `GET` | `/watchlist/user/:username` | Opcional | Visualiza watchlist de outro usuário (se perfil for público) |

### ⭐ Avaliações & Reviews (`/reviews`)
| Método | Rota | Proteção | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/reviews` | JWT | Registra ou atualiza nota (0.5 a 10) e resenha |
| `PATCH` | `/reviews/:id` | JWT | Edita nota ou comentário de uma avaliação |
| `DELETE` | `/reviews/:id` | JWT | Exclui uma avaliação |
| `GET` | `/reviews/media/:tmdbId?type=MOVIE&page=1&limit=10` | Pública | Avaliações da comunidade, nota média agregada e total |
| `GET` | `/reviews/me?page=1&limit=20` | JWT | Minhas avaliações |
| `GET` | `/reviews/me/media/:tmdbId?type=MOVIE` | JWT | Minha nota/avaliação específica para um título |
| `GET` | `/reviews/user/:username` | Opcional | Lista avaliações feitas por outro usuário |

### 🎬 Catálogo TMDB (`/tmdb`)
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/tmdb/movies/popular` | Filmes populares |
| `GET` | `/tmdb/movies/top-rated` | Filmes mais bem avaliados |
| `GET` | `/tmdb/movies/now-playing` | Filmes atualmente em cartaz nos cinemas |
| `GET` | `/tmdb/movies/upcoming` | Filmes que estreiam em breve nos cinemas |
| `GET` | `/tmdb/movies/trending?timeWindow=day` | Filmes em alta no dia ou semana |
| `GET` | `/tmdb/movies/discover` | Descobrir filmes por gêneros, ano, nota mínima e ordenação |
| `GET` | `/tmdb/movies/:id` | Detalhes completos do filme, elenco, trailer e onde assistir |
| `GET` | `/tmdb/movies/:id/trailer` | Trailer oficial HD do YouTube (com fallback internacional) |
| `GET` | `/tmdb/movies/:id/providers` | Plataformas oficiais onde assistir no Brasil (JustWatch) |
| `GET` | `/tmdb/movies/:id/credits` | Elenco e equipe técnica completa do filme |
| `GET` | `/tmdb/series/popular` | Séries populares |
| `GET` | `/tmdb/series/top-rated` | Séries mais bem avaliadas |
| `GET` | `/tmdb/series/trending?timeWindow=day` | Séries em alta no dia ou semana |
| `GET` | `/tmdb/series/discover` | Descobrir séries por gêneros, ano, nota mínima e ordenação |
| `GET` | `/tmdb/series/:id` | Detalhes completos da série e lista de temporadas |
| `GET` | `/tmdb/series/:id/season/:seasonNumber` | Episódios detalhados de uma temporada |
| `GET` | `/tmdb/series/:id/trailer` | Trailer oficial HD do YouTube (com fallback internacional) |
| `GET` | `/tmdb/series/:id/providers` | Plataformas oficiais onde assistir no Brasil |
| `GET` | `/tmdb/series/:id/credits` | Elenco e equipe técnica da série |
| `GET` | `/tmdb/person/:id` | Biografia, dados pessoais e filmografia de ator/diretor |
| `GET` | `/tmdb/search?query=...` | Busca unificada por texto em filmes e séries |
| `GET` | `/tmdb/genres/movies` | Lista de gêneros de filmes em Português |
| `GET` | `/tmdb/genres/series` | Lista de gêneros de séries em Português |
