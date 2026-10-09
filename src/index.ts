import type { Core } from '@strapi/strapi';

const DEFAULT_TITLE = 'Strapi + React on Zerops';
const DEFAULT_DESCRIPTION =
  'Headless CMS demo — sample blog posts below are seeded in Strapi. Edit them in the admin panel (/admin) and refresh the React app.';

const DEMO_BLOG_POSTS = [
  {
    title: 'Deploy Strapi on Zerops in minutes',
    slug: 'deploy-strapi-on-zerops',
    coverFile: 'deploy-strapi-on-zerops.svg',
    excerpt:
      'Import the strapi-react recipe to get PostgreSQL, a Strapi API on nodejs@24, and a static React storefront with project vault URLs wired for you.',
    body: `The strapi-react recipe is designed for a realistic small-production stack without a long checklist. You import one YAML bundle, Zerops creates the database and services, and Git-connected builds keep Strapi and the React app in sync.

On the Strapi side, production builds use Yarn 4 from the committed release binary, compile the admin panel, and deploy only what runtime needs: configuration, compiled output, dependencies, and public assets. PostgreSQL is provisioned as a managed service; connection strings arrive through Zerops env isolation so you never hard-code credentials in the repo.

The React storefront is a separate static service. Vite bakes VITE_API_URL at build time from the project vault, which points at your Strapi subdomain. After deploy, editors use Strapi admin on the API host while visitors hit the frontend hostname. Subdomain access and health checks are part of the recipe defaults, so you can verify the API with /_health and the SPA with a normal browser refresh.

If you are iterating locally, the dev setup deploys the full tree over SSH so you can run yarn develop and npm run dev against the same content types. When you are ready for production, push to main or trigger a Zerops build; caches for node_modules keep subsequent deploys fast.`,
  },
  {
    title: 'Headless CMS meets a React SPA',
    slug: 'headless-cms-react-spa',
    coverFile: 'headless-cms-react-spa.svg',
    excerpt:
      'Split the CMS and the UI: Strapi owns structured content and permissions; React fetches public JSON and renders fast static pages on Zerops.',
    body: `A headless architecture separates concerns that traditionally lived in one monolith. Strapi becomes the system of record for content models, editorial workflow, media library, and API tokens. The React app becomes a thin, replaceable presentation layer that can be redeployed independently whenever design or frontend code changes.

This demo wires two content endpoints into the storefront. Site Info is a single type for global marketing copy on the home page. Blog Post is a collection with draft and publish, cover media, and slug-based detail routes in React Router. Public role permissions are enabled in bootstrap for find and findOne so anonymous visitors can read published entries without exposing the admin API.

Cross-origin requests are explicit. The browser loads the SPA from the frontend hostname and calls the Strapi API on another subdomain. Strapi CORS must allow the storefront origin; the recipe documents vault keys APP_URL and API_URL so both sides agree on hostnames in dev and prod. The frontend shows list previews on the home page and full article text when you open a post.

That split pays off in team workflows. Content editors work entirely inside Strapi admin—no deploy required for copy changes once API responses update. Frontend engineers ship UI improvements on their own cadence. Operations scale each tier separately on Zerops: Node for Strapi, static nginx for the SPA, and PostgreSQL for durable storage.`,
  },
  {
    title: 'From draft to published post',
    slug: 'draft-to-published',
    coverFile: 'draft-to-published.svg',
    excerpt:
      'Use draft and publish on Blog Post entries so work-in-progress stays out of the public API until you are ready to go live.',
    body: `Collection types in Strapi support an editorial lifecycle that single types do not. When draft and publish is enabled, saving a new entry creates a draft document that only authenticated users see in admin. Publishing promotes the current draft to the live dataset consumers read through the REST API.

In this recipe, the React home page calls GET /api/blog-posts with sort by publishedAt descending. Unpublished drafts never appear in that list, which keeps the marketing site stable while authors prepare announcements. Opening a post uses the slug filter to load one entry for the detail view, again only for published documents.

Authors should fill title, slug, excerpt, and body, attach an optional cover image in the media field, and use excerpt for card previews while reserving body for the long-form article. After publish, a refresh of the storefront pulls the new JSON without redeploying the SPA—only static env changes such as a new API hostname require a frontend rebuild.

You can extend the same pattern for release notes, customer stories, or changelog entries. Add components or dynamic zones later if you need richer layouts; the demo stays intentionally small so the path from admin to API to React remains easy to follow.`,
  },
] as const;

const DEMO_COPY_MIN_LENGTH = 500;

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

async function syncDemoPostCopy(strapi: Core.Strapi) {
  const posts = await strapi.documents('api::blog-post.blog-post').findMany({});

  for (const post of posts) {
    const demo = DEMO_BLOG_POSTS.find((entry) => entry.slug === post.slug);
    if (!demo || !post.documentId) {
      continue;
    }

    const body = typeof post.body === 'string' ? post.body : '';
    if (body.length >= DEMO_COPY_MIN_LENGTH) {
      continue;
    }

    try {
      await strapi.documents('api::blog-post.blog-post').update({
        documentId: post.documentId,
        data: {
          excerpt: demo.excerpt,
          body: demo.body,
        } as Record<string, unknown>,
        status: 'published',
      });
    } catch (error) {
      strapi.log.warn(`Could not refresh demo copy for ${post.slug}: ${String(error)}`);
    }
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
    await syncDemoPostCopy(strapi);
    await syncDemoCovers(strapi);
    await ensurePublicApiPermissions(strapi);
  },
};
