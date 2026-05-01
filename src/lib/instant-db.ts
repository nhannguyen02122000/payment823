import { init } from '@instantdb/core';
import schema from '../../instant.schema';

const db = init({
  appId: process.env.INSTANT_APP_ID!,
  schema,
});

export default db;
