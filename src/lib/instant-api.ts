import dbServer from './instant-server';

type UserData = {
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  created_at?: number;
};

// Upsert system_users by clerk_id: update if exists, create if not
async function upsertUser(clerkId: string, data: UserData): Promise<void> {
  const username = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Unknown';

  const existingResult = await dbServer.query({ system_users: { $: { where: { clerk_id: clerkId } } } }) as {
    system_users: Array<{ id: string; clerk_id?: string }>;
  };

  const existingUser = existingResult.system_users[0];

  if (existingUser) {
    await dbServer.transact(
      dbServer.tx.system_users[existingUser.id].update({
        username,
        avatar_url: data.image_url ?? '',
      })
    );
  } else {
    const entityId = crypto.randomUUID();
    await dbServer.transact(
      dbServer.tx.system_users[entityId].create({
        clerk_id: clerkId,
        username,
        avatar_url: data.image_url ?? '',
        created_at: data.created_at ?? Date.now(),
      })
    );
  }
}

// Delete system_users by clerk_id
async function deleteUserByClerkId(clerkId: string): Promise<void> {
  const result = await dbServer.query({ system_users: { $: { where: { clerk_id: clerkId } } } }) as {
    system_users: Array<{ id: string; clerk_id?: string }>;
  };

  const existingUser = result.system_users[0];
  if (existingUser) {
    await dbServer.transact(dbServer.tx.system_users[existingUser.id].delete());
  }
}

// Query system_users
async function queryUsers(): Promise<{ system_users: Array<{ id: string; username?: string; avatar_url?: string }> }> {
  return dbServer.query({ system_users: {} }) as Promise<{ system_users: Array<{ id: string; username?: string; avatar_url?: string }> }>;
}

export { upsertUser, deleteUserByClerkId, queryUsers };