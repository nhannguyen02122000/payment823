import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import dbServer from '@/lib/instant-server';

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const uuid = searchParams.get('uuid');

  try {
    if (uuid) {
      // Fetch a single payment record by UUID
      const result = await dbServer.queryOnce({ payments: {} });
      const allPayments = result.data.payments as unknown as Array<{
        id: string;
        uuid: string;
        name: string;
        money: number;
        description?: string | null;
        created_by: string;
        updated_by: string;
        created_at: number;
        updated_at: number;
        deleted_at?: number | null;
      }>;
      const payment = allPayments.find((p) => p.uuid === uuid);

      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
      if (payment.deleted_at != null) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      return NextResponse.json({ payment });
    }

    // Return $users list for dropdown population
    const result = await dbServer.queryOnce({ $users: {} });
    const users = (result.data.$users ?? []).map((user) => ({
      id: user.id,
      username: user.username ?? 'Unknown',
      avatar_url: user.avatar_url ?? '',
    }));

    return NextResponse.json({ users });
  } catch (err) {
    console.error('GET /api/payments error:', err);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { uuid?: string; name?: string; money?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { uuid, name, money, description } = body;

  if (!uuid) {
    return NextResponse.json({ error: 'uuid is required' }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const moneyNum = parseInt(money ?? '', 10);
  if (isNaN(moneyNum) || moneyNum <= 0) {
    return NextResponse.json({ error: 'money must be a positive integer' }, { status: 400 });
  }

  try {
    // Query payments to find the record by uuid
    const paymentResult = await dbServer.queryOnce({ payments: {} });
    const allPayments = paymentResult.data.payments as unknown as Array<{ uuid: string; deleted_at?: number | null }>;
    const payment = allPayments.find((p) => p.uuid === uuid);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    if (payment.deleted_at != null) {
      return NextResponse.json({ error: 'Cannot edit a deleted payment' }, { status: 400 });
    }

    // Get current user's username for updated_by
    const userResult = await dbServer.queryOnce({ $users: {} });
    const allUsers = userResult.data.$users as unknown as Array<{ id: string; username?: string }>;
    const currentUser = allUsers.find((u) => u.id === clerkId);
    const username = currentUser?.username ?? 'Unknown';

    const now = Date.now();

    await dbServer.transact(
      dbServer.tx.payments[uuid].update({
        name,
        money: moneyNum,
        description: description ?? null,
        updated_at: now,
        updated_by: username,
      })
    );

    return NextResponse.json({
      uuid,
      name,
      money: moneyNum,
      description: description ?? null,
      updated_at: now,
      updated_by: username,
    });
  } catch (err) {
    console.error('PUT /api/payments error:', err);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
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