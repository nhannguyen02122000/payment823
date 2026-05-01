import dbServer from './instant-server';

type UserData = {
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  created_at?: number;
};

// Upsert $users by clerk_id: update if exists, create if not
async function upsertUser(clerkId: string, data: UserData): Promise<void> {
  const username = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Unknown';

  // Query to find existing user by clerk_id
  // We match on entity id = clerkId since that's the identifier
  const result = await dbServer.query({ $users: { $: { where: { clerk_id: clerkId } } } }) as {
    $users: Array<{ id: string; clerk_id?: string }>;
  };

  const existingUser = result.$users[0];

  if (existingUser) {
    // Update existing user
    await dbServer.transact(
      dbServer.tx.$users[existingUser.id].update({
        username,
        avatar_url: data.image_url ?? '',
      })
    );
  } else {
    // Create new user (use clerkId as entity ID for consistency)
    await dbServer.transact(
      dbServer.tx.$users[clerkId].create({
        clerk_id: clerkId,
        username,
        avatar_url: data.image_url ?? '',
        created_at: data.created_at ?? Date.now(),
      })
    );
  }
}

// Delete $users by clerk_id
async function deleteUserByClerkId(clerkId: string): Promise<void> {
  const result = await dbServer.query({ $users: { $: { where: { clerk_id: clerkId } } } }) as {
    $users: Array<{ id: string; clerk_id?: string }>;
  };

  const existingUser = result.$users[0];
  if (existingUser) {
    await dbServer.transact(dbServer.tx.$users[existingUser.id].delete());
  }
}

// Query $users
async function queryUsers(): Promise<{ $users: Array<{ id: string; username?: string; avatar_url?: string }> }> {
  return dbServer.query({ $users: {} }) as Promise<{ $users: Array<{ id: string; username?: string; avatar_url?: string }> }>;
}

export { upsertUser, deleteUserByClerkId, queryUsers };