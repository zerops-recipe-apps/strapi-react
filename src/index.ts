import fs from 'fs';
import path from 'path';

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
      'Import the Small Production stack from the Zerops recipe catalog. Strapi runs on nodejs@22 with Yarn 4 builds; the Vite frontend is baked as static files with VITE_API_URL pointing at your API hostname.',
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

async function uploadSeedCover(strapi: Core.Strapi, filename: string) {
  const absolutePath = path.join(process.cwd(), 'public', 'seed-covers', filename);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  const uploadService = strapi.plugin('upload').service('upload');
  const stat = fs.statSync(absolutePath);
  const mime = filename.endsWith('.svg') ? 'image/svg+xml' : 'image/png';

  const uploaded = await uploadService.upload({
    data: {
      fileInfo: {
        name: filename,
        alternativeText: filename.replace(/\.[^.]+$/, '').replace(/-/g, ' '),
      },
    },
    files: {
      path: absolutePath,
      name: filename,
      type: mime,
      size: stat.size,
    },
  });

  const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
  return file?.id ?? null;
}

async function attachCover(strapi: Core.Strapi, documentId: string, coverFile: string) {
  const coverId = await uploadSeedCover(strapi, coverFile);
  if (!coverId) {
    return;
  }

  await strapi.documents('api::blog-post.blog-post').update({
    documentId,
    // Media relation id — document types lag schema until types are regenerated
    data: { cover: coverId } as Record<string, unknown>,
  });
}

async function seedBlogPosts(strapi: Core.Strapi) {
  const existing = await strapi.documents('api::blog-post.blog-post').findMany({ limit: 1 });
  if (existing.length > 0) {
    return;
  }

  for (const post of DEMO_BLOG_POSTS) {
    const { coverFile, ...fields } = post;
    const created = await strapi.documents('api::blog-post.blog-post').create({
      data: fields,
      status: 'published',
    });
    if (created?.documentId) {
      await attachCover(strapi, created.documentId, coverFile);
    }
  }
}

async function syncBlogCovers(strapi: Core.Strapi) {
  const posts = await strapi.documents('api::blog-post.blog-post').findMany({
    populate: ['cover'],
  });

  for (const post of posts) {
    if (post.cover) {
      continue;
    }
    const demo = DEMO_BLOG_POSTS.find((entry) => entry.slug === post.slug);
    if (!demo || !post.documentId) {
      continue;
    }
    await attachCover(strapi, post.documentId, demo.coverFile);
  }
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await seedSiteInfo(strapi);
    await seedBlogPosts(strapi);
    await syncBlogCovers(strapi);
    await ensurePublicApiPermissions(strapi);
  },
};
