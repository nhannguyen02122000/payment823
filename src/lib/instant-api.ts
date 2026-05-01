const APP_ID = process.env.INSTANT_APP_ID!;
const ADMIN_TOKEN = process.env.INSTANTDB_ADMIN_TOKEN!;
const API_URI = 'https://api.instantdb.com';

async function instantFetch(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${API_URI}${path}?app_id=${APP_ID}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`InstantDB API error ${res.status}: ${text}`);
  }
  return res.json();
}

// Upsert $users by clerk_id (update if exists, create if not)
async function upsertUser(clerkId: string, data: {
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  created_at?: number;
}): Promise<void> {
  const username = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Unknown';
  await instantFetch('/admin/transact', {
    steps: [
      { op: ['update', '$users', ['lookup', 'clerk_id', clerkId], {
        clerk_id: clerkId,
        username,
        avatar_url: data.image_url ?? '',
        created_at: data.created_at ?? Date.now(),
      }] },
    ],
    'throw-on-missing-attrs?': false,
  });
}

// Delete $users by clerk_id
async function deleteUserByClerkId(clerkId: string): Promise<void> {
  await instantFetch('/admin/transact', {
    steps: [
      { op: ['delete', '$users', ['lookup', 'clerk_id', clerkId]] },
    ],
    'throw-on-missing-attrs?': false,
  });
}

// Query $users
async function queryUsers(): Promise<{ $users: Array<{ id: string; username?: string; avatar_url?: string }> }> {
  return instantFetch('/admin/query', {
    query: { $users: {} },
  }) as Promise<{ $users: Array<{ id: string; username?: string; avatar_url?: string }> }>;
}

export { upsertUser, deleteUserByClerkId, queryUsers, instantFetch };
