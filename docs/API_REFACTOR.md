Currently, we are using $users entity in InstantDB to store user's information. But it is a reserved entity of the system, let's not touch it.

We have 4 tasks:
1. We will introduce new entity called 'system_users'. Its attributes are:
system_users: i.entity({
      clerk_id: i.string().optional(),
      username: i.string().optional(),
      avatar_url: i.string().optional(),
      created_at: i.number().optional(),
    })

2. Now, for Clerk user webhook, instead of storing into $users, we strore into 'system_users' entity instead
3. For every API working with $users, change to 'system_users' instead
4. Update CLAUDE.md for this