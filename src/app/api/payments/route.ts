import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import dbServer from '@/lib/instant-server';

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await dbServer.queryOnce({ $users: {} });
    const users = (result.data.$users ?? []).map((user) => ({
      id: user.id,
      username: user.username ?? 'Unknown',
      avatar_url: user.avatar_url ?? '',
    }));

    return NextResponse.json({ users });
  } catch (err) {
    console.error('GET /api/payments error:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { name?: string; money?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, money, description } = body;

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const moneyNum = parseInt(money ?? '', 10);
  if (isNaN(moneyNum) || moneyNum <= 0) {
    return NextResponse.json({ error: 'money must be a positive integer' }, { status: 400 });
  }

  try {
    // Get current user's username from $users (entity ID = clerkId)
    const userResult = await dbServer.queryOnce({ $users: {} });
    const allUsers = userResult.data.$users as unknown as Array<{ id: string; username?: string }>;
    const currentUser = allUsers.find((u) => u.id === clerkId);
    const username = currentUser?.username ?? 'Unknown';

    const uuid = crypto.randomUUID();
    const now = Date.now();

    await dbServer.transact(
      dbServer.tx.payments[uuid].create({
        uuid,
        name,
        money: moneyNum,
        description: description ?? null,
        created_by: username,
        updated_by: username,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      })
    );

    return NextResponse.json(
      {
        uuid,
        name,
        money: moneyNum,
        description: description ?? null,
        created_by: username,
        updated_by: username,
        created_at: now,
        updated_at: now,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/payments error:', err);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}