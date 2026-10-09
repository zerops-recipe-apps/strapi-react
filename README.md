# Strapi + React (backend)

<!-- #ZEROPS_EXTRACT_START:intro# -->
Strapi v5.12 headless CMS on [Zerops](https://zerops.io), paired with a separate [React frontend](https://github.com/zerops-recipe-apps/strapi-react-frontend). PostgreSQL ships with the recipe. A **Site Info** single type seeds default copy; the React app renders it from `/api/site-info`. Import only `strapi*` services for CMS-only.
<!-- #ZEROPS_EXTRACT_END:intro# -->

## Repos

| Repo | Role |
| --- | --- |
| [strapi-react](https://github.com/zerops-recipe-apps/strapi-react) | Strapi API + admin (`/admin`) |
| [strapi-react-frontend](https://github.com/zerops-recipe-apps/strapi-react-frontend) | Vite + React SPA |

Recipe imports: [`.zerops-recipe/`](.zerops-recipe/) and [`zeropsio/recipes/strapi-react`](https://github.com/zeropsio/recipes/tree/main/strapi-react).

## Local

```bash
yarn develop   # :1337, admin /admin
```

Point the frontend `VITE_API_URL` at your Strapi URL.

<!-- #ZEROPS_EXTRACT_START:faq# -->
## FAQ

**Backend-only** — omit `frontend*` services from the import.

**Setups** — only `dev` and `prod`. Hostname `strapistage` uses `zeropsSetup: prod`.

**Node** — Strapi 5 requires Node ≤ 22; Zerops services use `nodejs@22`.

**Content** — edit **Site Info** in Strapi admin; bootstrap enables public read on `/api/site-info`.
<!-- #ZEROPS_EXTRACT_END:faq# -->

<!-- #ZEROPS_EXTRACT_START:integration-guide# -->
## Integration

- Strapi `prod`: Yarn 4 via `corepack enable`; deploy `config/`, `src/`, `dist/`, `public/`, `node_modules`.
- Strapi `dev`: `deployFiles: ./`, `yarn develop` over SSH.
- Frontend `prod`: Vite build → `static` runtime; `VITE_API_URL` from vault `API_URL`.
<!-- #ZEROPS_EXTRACT_END:integration-guide# -->
