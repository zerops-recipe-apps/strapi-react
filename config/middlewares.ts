const ZEROPS_FRONTEND_ORIGIN =
  /^https:\/\/frontend-[a-z0-9-]+\.prg1\.zerops\.app$/;

function resolveCorsOrigin(env: (key: string) => string | undefined) {
  return (ctx: { request: { header: { origin?: string } } }) => {
    const origin = ctx.request.header.origin;
    if (!origin) {
      return true;
    }

    const allowed = [
      env('APP_URL'),
      env('DEV_APP_URL'),
      'http://localhost:5173',
      'http://localhost:4173',
    ].filter((value): value is string => Boolean(value) && value.startsWith('http'));

    if (allowed.includes(origin) || ZEROPS_FRONTEND_ORIGIN.test(origin)) {
      return origin;
    }

    return false;
  };
}

export default ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: resolveCorsOrigin(env),
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
