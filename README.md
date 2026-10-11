# Strapi + React (backend) — moved

The CMS app now lives in **[zerops-recipe-apps/strapi](https://github.com/zerops-recipe-apps/strapi)**. This repository is kept for backward-compatible links; new work and deploys should use the `strapi` repo and [`zeropsio/recipes/strapi`](https://github.com/zeropsio/recipes/tree/main/strapi).

<!-- #ZEROPS_EXTRACT_START:intro# -->
Strapi v5.12 on [Zerops](https://zerops.io) with optional [React frontend](https://github.com/zerops-recipe-apps/strapi-react-frontend). Deploy CMS from [strapi](https://github.com/zerops-recipe-apps/strapi) or the full stack via [`strapi-react` recipe](https://github.com/zeropsio/recipes/tree/main/strapi-react).
<!-- #ZEROPS_EXTRACT_END:intro# -->

## Repos

| Repo | Role |
| --- | --- |
| [strapi](https://github.com/zerops-recipe-apps/strapi) | Strapi API + admin (`/admin`) |
| [strapi-react-frontend](https://github.com/zerops-recipe-apps/strapi-react-frontend) | Vite + React SPA |

Recipe imports: [`zeropsio/recipes/strapi`](https://github.com/zeropsio/recipes/tree/main/strapi) (CMS), [`strapi-react`](https://github.com/zeropsio/recipes/tree/main/strapi-react) (CMS + React).

## Local

```bash
yarn develop   # :1337, admin /admin
```

Point the frontend `VITE_API_URL` at your Strapi URL.

<!-- #ZEROPS_EXTRACT_START:faq# -->
## FAQ

**Backend-only** — omit `frontend*` services from the import.

**Setups** — only `dev` and `prod`. Hostname `strapistage` uses `zeropsSetup: prod`.

**Node** — Zerops Strapi services use `nodejs@24`; local dev should match `package.json` engines.

**Content** — edit **Site Info** in Strapi admin; bootstrap enables public read on `/api/site-info`.
<!-- #ZEROPS_EXTRACT_END:faq# -->

<!-- #ZEROPS_EXTRACT_START:integration-guide# -->
## Integration

- Strapi `prod`: Yarn 4 from `.yarn/releases/`; deploy `config/`, `src/`, `dist/`, `public/`, `node_modules`.
- Strapi `dev`: `deployFiles: ./`, `yarn develop` over SSH.
- Frontend `prod`: Vite build → `static` runtime; `VITE_API_URL` from vault `API_URL`.
<!-- #ZEROPS_EXTRACT_END:integration-guide# -->
