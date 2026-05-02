import type { InstantRules } from '@instantdb/core';

const perms: InstantRules = {
  $users: {
    bind: [],
    allow: {
      create: 'true',
      view: 'true',
      update: 'true',
      delete: 'false',
    },
  },
  system_users: {
    bind: [],
    allow: {
      create: 'true',
      view: 'true',
      update: 'true',
      delete: 'false',
    },
  },
  payments: {
    bind: [],
    allow: {
      create: 'true',
      view: 'true',
      update: 'true',
      delete: 'true',
    },
  },
};

export default perms;
