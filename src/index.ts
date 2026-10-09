import type { Core } from '@strapi/strapi';

const DEFAULT_TITLE = 'Strapi + React on Zerops';
const DEFAULT_DESCRIPTION =
  'Headless CMS demo — sample blog posts below are seeded in Strapi. Edit them in the admin panel (/admin) and refresh the React app.';

const DEMO_BLOG_POSTS = [
  {
    title: 'Deploy Strapi on Zerops in minutes',
    slug: 'deploy-strapi-on-zerops',
    coverFile: 'deploy-strapi-on-zerops.svg',
    excerpt: 'Use the strapi-react recipe: PostgreSQL, prod builds, and a static React storefront on subdomains.',
    body:
      'Import the Small Production stack from the Zerops recipe catalog. Strapi runs on nodejs@24 with Yarn 4 builds; the Vite frontend is baked as static files with VITE_API_URL pointing at your API hostname.',
  },
  {
    title: 'Headless CMS meets a React SPA',
    slug: 'headless-cms-react-spa',
    coverFile: 'headless-cms-react-spa.svg',
    excerpt: 'Content lives in Strapi; the storefront fetches JSON over HTTPS with public read permissions.',
    body:
      'Editors work in Strapi admin while developers ship the React app independently. CORS allows the Zerops frontend origin so the browser can call /api/blog-posts and /api/site-info safely.',
  },
  {
    title: 'From draft to published post',
    slug: 'draft-to-published',
    coverFile: 'draft-to-published.svg',
    excerpt: 'Blog posts use draft & publish — only published entries appear on the demo site.',
    body:
      'Create a new Blog Post in admin, fill title and excerpt, publish, then reload the React app. The collection type is a better fit than a single type when you want a list of entries.',
  },
] as const;

function demoCoverPath(coverFile: string) {
  return `/seed-covers/${coverFile}`;
}

async function ensurePublicPermission(strapi: Core.Strapi, action: string) {
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (!publicRole) {
    return;
  }

  const permission = await strapi.db.query('plugin::users-permissions.permission').findOne({
    where: {
      role: publicRole.id,
      action,
    },
  });

  if (!permission) {
    await strapi.db.query('plugin::users-permissions.permission').create({
      data: {
        role: publicRole.id,
        action,
        enabled: true,
      },
    });
    return;
  }

  if (!permission.enabled) {
    await strapi.db.query('plugin::users-permissions.permission').update({
      where: { id: permission.id },
      data: { enabled: true },
    });
  }
}

async function ensurePublicApiPermissions(strapi: Core.Strapi) {
  await ensurePublicPermission(strapi, 'api::site-info.site-info.find');
  await ensurePublicPermission(strapi, 'api::blog-post.blog-post.find');
  await ensurePublicPermission(strapi, 'api::blog-post.blog-post.findOne');
}

async function seedSiteInfo(strapi: Core.Strapi) {
  const existing = await strapi.documents('api::site-info.site-info').findFirst();
  if (existing) {
    return;
  }

  await strapi.documents('api::site-info.site-info').create({
    data: {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    },
  });
}

async function seedBlogPosts(strapi: Core.Strapi) {
  const existing = await strapi.documents('api::blog-post.blog-post').findMany({ limit: 1 });
  if (existing.length > 0) {
    return;
  }

  for (const post of DEMO_BLOG_POSTS) {
    const { coverFile, ...fields } = post;
    await strapi.documents('api::blog-post.blog-post').create({
      data: {
        ...fields,
        coverUrl: demoCoverPath(coverFile),
      },
      status: 'published',
    });
  }
}

async function syncDemoCovers(strapi: Core.Strapi) {
  const posts = await strapi.documents('api::blog-post.blog-post').findMany({
    populate: ['cover'],
  });

  for (const post of posts) {
    const demo = DEMO_BLOG_POSTS.find((entry) => entry.slug === post.slug);
    if (!demo || !post.documentId) {
      continue;
    }

    const hasMedia = Boolean(post.cover);
    const hasUrl = Boolean(post.coverUrl);
    if (hasMedia && hasUrl) {
      continue;
    }

    if (hasUrl) {
      continue;
    }

    try {
      await strapi.documents('api::blog-post.blog-post').update({
        documentId: post.documentId,
        data: { coverUrl: demoCoverPath(demo.coverFile) } as Record<string, unknown>,
        status: 'published',
      });
    } catch (error) {
      strapi.log.warn(`Could not set coverUrl for ${post.slug}: ${String(error)}`);
    }
  }
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await seedSiteInfo(strapi);
    await seedBlogPosts(strapi);
    await syncDemoCovers(strapi);
    await ensurePublicApiPermissions(strapi);
  },
};
