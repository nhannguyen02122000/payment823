import { init } from '@instantdb/admin';

const dbServer = init({
  appId: process.env.INSTANT_APP_ID!,
  adminToken: process.env.INSTANTDB_ADMIN_TOKEN!,
});

export default dbServer;
