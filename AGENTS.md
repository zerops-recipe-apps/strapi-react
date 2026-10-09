# strapi-react

Strapi v5.12 headless CMS on Zerops (`nodejs@22`). Storefront: [strapi-react-frontend](https://github.com/zerops-recipe-apps/strapi-react-frontend).

## Layout

| Repo | Zerops setups | Port |
| --- | --- | --- |
| This repo (Strapi) | `dev`, `prod` | 1337 |
| `strapi-react-frontend` | `dev`, `prod` (static) | 80 (nginx) |

Recipe: [`zeropsio/recipes/strapi-react`](https://github.com/zeropsio/recipes/tree/main/strapi-react).

## Notes

- Strapi engines: Node **18–22** only — Zerops service type `nodejs@22`.
- Default **Site Info** single type seeds on bootstrap; public `find` enabled for `/api/site-info`.
- Project **vault** in import YAML; map `API_URL` / `APP_URL` in `zerops.yml`.
- `dev`: `deployFiles: ./`, SSH + `yarn develop`.
