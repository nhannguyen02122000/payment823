import { init } from '@instantdb/core';
import schema from '../../instant.schema';

const dbServer = init({
  appId: process.env.INSTANT_APP_ID!,
  schema,
  // @ts-ignore - internal property for admin token
  __adminToken: process.env.INSTANTDB_ADMIN_TOKEN!,
});

export default dbServer;
