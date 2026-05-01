import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import dbServer from '@/lib/instant-server';

interface Payment {
  uuid: string;
  name: string;
  money: number;
  created_at: number;
  deleted_at?: number | null;
}

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const now = new Date();
  const defaultMonth = now.getMonth() + 1; // 1-indexed
  const defaultYear = now.getFullYear();

  const month = parseInt(searchParams.get('month') ?? String(defaultMonth), 10);
  const year = parseInt(searchParams.get('year') ?? String(defaultYear), 10);

  if (isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'month must be 1–12' }, { status: 400 });
  }
  if (isNaN(year) || year < 1970) {
    return NextResponse.json({ error: 'invalid year' }, { status: 400 });
  }

  const monthStart = new Date(year, month - 1, 1).getTime();
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999).getTime();

  try {
    const result = await dbServer.query({ payments: {} });
    const allPayments = (result as unknown as { data: { payments: Payment[] } }).data.payments;

    // Filter: not deleted, within the month
    const filtered = allPayments.filter(
      (p) => p.deleted_at == null && p.created_at >= monthStart && p.created_at <= monthEnd
    );

    // Group by name
    const moneyPerPerson: Record<string, number> = {};
    for (const p of filtered) {
      moneyPerPerson[p.name] = (moneyPerPerson[p.name] ?? 0) + p.money;
    }

    const totalMoneySpent = Object.values(moneyPerPerson).reduce((a, b) => a + b, 0);
    const numberOfNames = Object.keys(moneyPerPerson).length;

    if (numberOfNames === 0) {
      return NextResponse.json({
        moneyPerPerson: {},
        totalMoneySpent: 0,
        perPerson: 0,
        transfers: [],
        month,
        year,
      });
    }

    const perPerson = parseFloat((totalMoneySpent / numberOfNames).toFixed(2));

    const envUser = process.env.ENV_USER_TO_SUMARIZE ?? '';
    const transfers: Array<{ from: string; to: string; amount: number }> = [];

    for (const [person, spent] of Object.entries(moneyPerPerson)) {
      if (person === envUser) continue;

      const diff = spent - perPerson;
      if (Math.abs(diff) < 0.001) continue; // skip if essentially equal

      if (diff > 0) {
        transfers.push({ from: person, to: envUser, amount: parseFloat(diff.toFixed(2)) });
      } else {
        transfers.push({ from: envUser, to: person, amount: parseFloat(Math.abs(diff).toFixed(2)) });
      }
    }

    return NextResponse.json({
      moneyPerPerson,
      totalMoneySpent,
      perPerson,
      transfers,
      month,
      year,
    });
  } catch (err) {
    console.error('GET /api/summarize error:', err);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
