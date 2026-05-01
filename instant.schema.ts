import { i } from '@instantdb/core';

export default i.schema({
  entities: {
    $users: i.entity({
      clerk_id: i.string().optional(),
      username: i.string().optional(),
      avatar_url: i.string().optional(),
      created_at: i.number().optional(),
    }),
    payments: i.entity({
      name: i.string().indexed(),
      money: i.number(),
      description: i.string().optional(),
      created_by: i.string(),
      updated_by: i.string(),
      created_at: i.number().indexed(),
      updated_at: i.number(),
      deleted_at: i.number().optional(),
    }),
  },
  links: {},
});
