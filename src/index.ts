import type { Core } from '@strapi/strapi';

const DEFAULT_TITLE = 'Welcome to Strapi on Zerops';
const DEFAULT_DESCRIPTION =
  'This headline and body come from the Site Info single type in Strapi. Edit them in the admin panel (/admin) and refresh the React app.';

async function ensurePublicSiteInfoPermission(strapi: Core.Strapi) {
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (!publicRole) {
    return;
  }

  const permission = await strapi.db.query('plugin::users-permissions.permission').findOne({
    where: {
      role: publicRole.id,
      action: 'api::site-info.site-info.find',
    },
  });

  if (permission && !permission.enabled) {
    await strapi.db.query('plugin::users-permissions.permission').update({
      where: { id: permission.id },
      data: { enabled: true },
    });
  }
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

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await seedSiteInfo(strapi);
    await ensurePublicSiteInfoPermission(strapi);
  },
};
