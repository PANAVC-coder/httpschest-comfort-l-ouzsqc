import { createApplication, resend } from "@specific-dev/framework";
import * as appSchema from './db/schema/schema.js';
import * as authSchema from './db/schema/auth-schema.js';
import { registerEntriesRoutes } from './routes/entries.js';
import { seedDemoData } from './seed.js';

const schema = { ...appSchema, ...authSchema };

export const app = await createApplication(schema);

export type App = typeof app;

app.withAuth({
  emailAndPassword: {
    sendResetPassword: async ({ user, url }) => {
      resend.emails.send({
        from: 'Chest Comfort Tracker <noreply@example.com>',
        to: user.email,
        subject: 'Reset your password',
        html: `<p>Click to reset your password: <a href="${url}">${url}</a></p>`,
      });
    },
  },
});

registerEntriesRoutes(app);

await seedDemoData(app);

await app.run();
app.logger.info('Application running');
