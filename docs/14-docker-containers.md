# Running RosettaDash in Containers

RosettaDash can run locally with **Docker** and **Docker Compose** — no Node.js install on the host required (only Docker).

Two modes are supported:

| Mode | Command | URL | Use when |
|------|---------|-----|----------|
| **Dev** | `npm run docker:dev` | <http://localhost:4200> | Active development with hot reload |
| **App** | `npm run docker:app` | <http://localhost:8080> | Quick run of a production-style build |

Both modes include the **Angular client** and **NestJS API**. Project data is stored **in memory** inside the server process (same as native `npm start`); restarting the container clears unsaved in-memory state unless you add external persistence later.

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine + Compose v2 | `docker compose version` should work |
| Git clone of this repo | Same as native setup |

Node.js on the host is **optional** when using containers only.

---

## Dev containers (hot reload)

Best for day-to-day builder work inside Docker. Source is bind-mounted; `node_modules` uses a named volume for performance.

```bash
# From repo root (rosettadash/)
npm run docker:dev
```

| Service | URL |
| --------- | ----- |
| Builder UI | <http://localhost:4200> |
| API (direct) | <http://localhost:3000/api> |
| Health | <http://localhost:3000/api/health> |

The Angular dev server proxies `/api/*` to the NestJS server (same as native dev).

Stop:

```bash
npm run docker:dev:down
# or Ctrl+C then:
docker compose --profile dev down
```

### Dev notes

- **First start** can take several minutes (`npm ci` in the image + Nx compile).
- File watching uses polling (`CHOKIDAR_USEPOLLING`) for reliable reload on macOS/Windows bind mounts.
- After changing `package.json` or `package-lock.json`, rebuild: `docker compose --profile dev up --build`.
- Playwright e2e is **not** run inside these containers by default; use native `npm run e2e` on the host for CI-parity testing.

---

## App containers (production-style)

Builds client + server inside the image and serves the UI through **nginx** on port **8080**, proxying `/api` to NestJS.

```bash
npm run docker:app
```

| Service | URL |
|---------|-----|
| Builder UI + API | <http://localhost:8080> |
| Health (via nginx) | <http://localhost:8080/api/health> |

Stop:

```bash
npm run docker:app:down
```

This image is intended for **local/demo** use. It is not a hardened production deployment recipe (no TLS, single-node, in-memory projects).

---

## Optional builder authentication

The NestJS API supports an optional shared API key gate (DAS-51). **Disabled by default** so local dev and e2e keep working without credentials.

| Variable | Default | Purpose |
|----------|---------|---------|
| `BUILDER_AUTH_ENABLED` | `false` | When `true`, all `/api/*` routes except health and auth config/login require a key |
| `BUILDER_API_KEY` | unset | Shared secret; required when auth is enabled |

Clients send the key via `Authorization: Bearer <key>` or `x-rosettadash-api-key`. The Angular builder stores the key in `sessionStorage` after a successful login prompt.

Example (dev profile):

```bash
BUILDER_AUTH_ENABLED=true BUILDER_API_KEY=dev-secret docker compose --profile dev up --build
```

Compose sets `BUILDER_AUTH_ENABLED=false` by default; uncomment `BUILDER_API_KEY` in `docker-compose.yml` when enabling auth.

---

## Health checks

Both compose services define Docker `HEALTHCHECK` against `/api/health`.

```bash
docker compose --profile dev ps
docker compose --profile app ps
```

Manual check:

```bash
curl http://localhost:3000/api/health    # dev profile
curl http://localhost:8080/api/health    # app profile
```

---

## Backend parity databases and servers (separate from builder dev)

The **builder dev** profiles above (`dev`, `app`) run only the Angular client
and in-memory Nest API. The **backend parity stack** (DAS-185) lives in
`docker/compose.backends.yml`, included from the root compose file.

| Command | What starts |
| --------- | ------------- |
| `npm run parity:db:up` | Four seeded DB containers + Supabase gateway |
| `npm run parity:servers:up` | Four generated server containers (after `parity:generate`) |
| `npm run parity:down` | Stop parity services |

Connection strings: `docker/seed/connection.env`. Full guide:
[Backend parity stack](./44-backend-parity-stack.md).

These containers do **not** replace the builder API on :3000; they validate
exported server/database code against real engines.

---

## Files

| File | Purpose |
| ------ | --------- |
| `Dockerfile.dev` | Dev image (Node 22, npm 11, `npm start`) |
| `Dockerfile` | Multi-stage production-style image (build + nginx + Node) |
| `docker-compose.yml` | Compose profiles `dev` and `app` |
| `docker/nginx.prod.conf` | nginx static + `/api` reverse proxy |
| `docker/entrypoint.prod.sh` | Starts NestJS + nginx in app image |
| `.dockerignore` | Keeps build context small |

---

## Native vs containers

| | Native (`npm start`) | Dev container | App container |
| -- | --------------------- | --------------- | --------------- |
| Node on host | Required | Not required | Not required |
| Hot reload | Yes | Yes | No (rebuild image) |
| Default UI port | 4200 | 4200 | 8080 |
| Typical use | Contributors with Node installed | Docker-first developers | Demo / smoke test |

You can use either workflow; CI still validates native `npm run verify` and `npm run e2e`.

---

## Troubleshooting

| Symptom | Fix |
| --------- | ----- |
| Port already in use | Stop native `npm start` or change compose port mapping |
| Dev container stuck on compile | Wait for first boot; check logs with `docker compose --profile dev logs -f` |
| Changes not reloading | Polling is enabled; on Linux ensure bind mount is writable |
| `package.json` changes ignored | Rebuild: `docker compose --profile dev up --build` |
| App profile 502 on `/api` | Server still starting; wait for health check or check `docker compose --profile app logs` |

---

## Related documents

- [Local Development & Components](./13-local-development-and-components.md) — native setup
- [CI and Hosting](./12-ci-and-hosting.md)
- [Architecture](./02-architecture.md)
