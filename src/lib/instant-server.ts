import { init } from '@instantdb/admin';
import schema from '../../instant.schema';

const dbServer = init({
  appId: process.env.INSTANT_APP_ID!,
  adminToken: process.env.INSTANTDB_ADMIN_TOKEN!,
  schema,
});

export default dbServer;
