import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import dbServer from '@/lib/instant-server';

type PaymentRow = {
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
  payment_date?: number | null;
};

type UserRow = {
  id: string;
  clerk_id?: string;
  username?: string;
  avatar_url?: string;
};

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const uuid = searchParams.get('uuid');
  const list = searchParams.get('list');

  try {
    if (uuid) {
      // Fetch a single payment record by UUID
      const result = await dbServer.query({ payments: {} }) as unknown as { payments: PaymentRow[] };
      const payment = result.payments.find((p) => p.uuid === uuid);

      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
      if (payment.deleted_at != null) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      return NextResponse.json({ payment });
    }

    if (list !== null) {
      // Listing payments with pagination, filtering, and sorting
      const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
      const sortBy = searchParams.get('sort_by') ?? 'updated_at';
      const sortOrder = searchParams.get('sort_order') ?? 'desc';
      const name = searchParams.get('name') ?? '';
      const moneyMin = searchParams.get('money_min');
      const moneyMax = searchParams.get('money_max');
      const createdFrom = searchParams.get('created_from');
      const createdTo = searchParams.get('created_to');
      const updatedFrom = searchParams.get('updated_from');
      const updatedTo = searchParams.get('updated_to');
      const allParam = searchParams.get('all');

      // Default to current month filter if not requesting all
      let defaultFrom: number | undefined;
      let defaultTo: number | undefined;
      if (!allParam) {
        const now = new Date();
        defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      }

      function parseDateTimeParam(value: string | null): number | undefined {
        if (!value) return undefined;
        const parsed = Date.parse(value);
        return isNaN(parsed) ? undefined : parsed;
      }

      const effectiveCreatedFrom = parseDateTimeParam(createdFrom) ?? defaultFrom;
      const effectiveCreatedTo = parseDateTimeParam(createdTo) ?? defaultTo;
      const effectiveUpdatedFrom = parseDateTimeParam(updatedFrom);
      const effectiveUpdatedTo = parseDateTimeParam(updatedTo);

      const result = await dbServer.query({ payments: {}, system_users: {} }) as unknown as { payments: PaymentRow[] };
      let filtered = result.payments.filter((p) => p.deleted_at == null);

      // Filter by name
      if (name) {
        filtered = filtered.filter((p) => p.name === name);
      }

      // Filter by money range
      if (moneyMin) {
        const min = parseInt(moneyMin, 10);
        if (!isNaN(min)) filtered = filtered.filter((p) => p.money >= min);
      }
      if (moneyMax) {
        const max = parseInt(moneyMax, 10);
        if (!isNaN(max)) filtered = filtered.filter((p) => p.money <= max);
      }

      // Filter by created_at range
      if (effectiveCreatedFrom != null) {
        filtered = filtered.filter((p) => p.created_at >= effectiveCreatedFrom);
      }
      if (effectiveCreatedTo != null) {
        filtered = filtered.filter((p) => p.created_at <= effectiveCreatedTo);
      }

      // Filter by updated_at range
      if (effectiveUpdatedFrom != null) {
        filtered = filtered.filter((p) => p.updated_at >= effectiveUpdatedFrom);
      }
      if (effectiveUpdatedTo != null) {
        filtered = filtered.filter((p) => p.updated_at <= effectiveUpdatedTo);
      }

      // Sort
      const validSortFields = ['name', 'money', 'created_at', 'updated_at'];
      const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'updated_at';
      const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

      filtered.sort((a, b) => {
        const aVal = a[safeSortBy as keyof typeof a];
        const bVal = b[safeSortBy as keyof typeof b];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (aVal < bVal) return safeSortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return safeSortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const payments = filtered.slice(offset, offset + limit);

      return NextResponse.json({ payments, total, page, limit, totalPages });
    }

    // Return users list for dropdown population
    const result = await dbServer.query({ system_users: {} }) as unknown as { system_users: UserRow[] };
    const users = (result.system_users ?? []).map((user) => ({
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

  let body: { uuid?: string; name?: string; money?: string; description?: string; payment_date?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { uuid, name, money, description, payment_date } = body;

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
    const paymentResult = await dbServer.query({ payments: {} }) as unknown as { payments: PaymentRow[] };
    const payment = paymentResult.payments.find((p) => p.uuid === uuid);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    if (payment.deleted_at != null) {
      return NextResponse.json({ error: 'Cannot edit a deleted payment' }, { status: 400 });
    }

    // Get current user's username for updated_by
    const userResult = await dbServer.query({ system_users: {} }) as unknown as { system_users: UserRow[] };
    const currentUser = userResult.system_users.find((u) => u.clerk_id === clerkId);
    const username = currentUser?.username ?? 'Unknown';

    const now = Date.now();

    const updateData: Record<string, unknown> = {
      name,
      money: moneyNum,
      description: description ?? null,
      updated_at: now,
      updated_by: username,
    };
    const parsed = Date.parse(payment_date ?? '');
    if (payment_date !== undefined) {
      if (isNaN(parsed)) {
        return NextResponse.json({ error: 'payment_date must be a valid date string' }, { status: 400 });
      }
      updateData.payment_date = parsed;
    }
    await dbServer.transact(dbServer.tx.payments[uuid].update(updateData as any));

    return NextResponse.json({
      uuid,
      name,
      money: moneyNum,
      description: description ?? null,
      updated_at: now,
      updated_by: username,
      payment_date: (updateData.payment_date as number | undefined) ?? payment?.payment_date,
    });
  } catch (err) {
    console.error('PUT /api/payments error:', err);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { uuid?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { uuid } = body;
  if (!uuid) {
    return NextResponse.json({ error: 'uuid is required' }, { status: 400 });
  }

  try {
    const paymentResult = await dbServer.query({ payments: {} }) as unknown as { payments: PaymentRow[] };
    const payment = paymentResult.payments.find((p) => p.uuid === uuid);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    if (payment.deleted_at != null) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const userResult = await dbServer.query({ system_users: {} }) as unknown as { system_users: UserRow[] };
    const currentUser = userResult.system_users.find((u) => u.clerk_id === clerkId);
    const username = currentUser?.username ?? 'Unknown';

    const now = Date.now();

    await dbServer.transact(
      dbServer.tx.payments[uuid].update({
        deleted_at: now,
        updated_at: now,
        updated_by: username,
      }) as any
    );

    return NextResponse.json({ uuid, deleted_at: now, updated_at: now, updated_by: username });
  } catch (err) {
    console.error('DELETE /api/payments error:', err);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { name?: string; money?: string; description?: string; payment_date?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, money, description, payment_date } = body;

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const moneyNum = parseInt(money ?? '', 10);
  if (isNaN(moneyNum) || moneyNum <= 0) {
    return NextResponse.json({ error: 'money must be a positive integer' }, { status: 400 });
  }

  const paymentDateMs = payment_date ? Date.parse(payment_date) : Date.now();
  if (payment_date && isNaN(paymentDateMs)) {
    return NextResponse.json({ error: 'payment_date must be a valid date string' }, { status: 400 });
  }

  try {
    // Get current user's username from users (lookup by clerk_id attribute)
    const userResult = await dbServer.query({ system_users: {} }) as unknown as { system_users: UserRow[] };
    const currentUser = userResult.system_users.find((u) => u.clerk_id === clerkId);
    const username = currentUser?.username ?? 'Unknown';

    const uuid = crypto.randomUUID();
    const now = Date.now();

    await dbServer.transact(
      dbServer.tx.payments[uuid].create({
        uuid,
        name,
        money: moneyNum,
        description: description ?? null,
        payment_date: paymentDateMs,
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
        payment_date: paymentDateMs,
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
