import { init, id } from "@instantdb/admin";
import _schema from "./instant.schema";
import { INSTANT_APP_ID, INSTANT_ADMIN_TOKEN, ALLOWED_NAMES } from "./config";

const db = init({
  appId: INSTANT_APP_ID!,
  adminToken: INSTANT_ADMIN_TOKEN!,
  schema: _schema,
});

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PaymentData {
  id?: string;
  name: string;
  money: number;
  description?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function now(): number {
  return Date.now();
}

function formatMoney(money: number): string {
  return `${(money * 1000).toLocaleString("vi-VN")} VND`;
}

// ─── CRUD Operations ───────────────────────────────────────────────────────────

export async function createPayment(params: {
  name: string;
  money: number;
  description?: string;
  createdBy: string;
}): Promise<{ id: string; formattedMoney: string }> {
  const paymentId = id();
  const timestamp = now();

  db.transact(
    db.tx.payments[paymentId].create({
      name: params.name,
      money: params.money,
      description: params.description ?? null,
      createdBy: params.createdBy,
      updatedBy: params.createdBy,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    })
  );

  return { id: paymentId, formattedMoney: formatMoney(params.money) };
}

export async function updatePayment(params: {
  id: string;
  name: string;
  money: number;
  description?: string;
  updatedBy: string;
}): Promise<{ success: boolean; formattedMoney: string }> {
  const existing = await db.query({
    payments: {
      $: { where: { id: params.id } },
    },
  });

  if (existing.payments.length === 0) {
    return { success: false, formattedMoney: "" };
  }

  const payment = existing.payments[0] as PaymentData;
  if (payment.deletedAt != null) {
    return { success: false, formattedMoney: "" };
  }

  db.transact(
    db.tx.payments[params.id].update({
      name: params.name,
      money: params.money,
      description: params.description ?? null,
      updatedBy: params.updatedBy,
      updatedAt: now(),
    })
  );

  return { success: true, formattedMoney: formatMoney(params.money) };
}

export async function softDeletePayment(params: {
  id: string;
  updatedBy: string;
}): Promise<boolean> {
  const existing = await db.query({
    payments: {
      $: { where: { id: params.id } },
    },
  });

  if (existing.payments.length === 0) return false;

  const payment = existing.payments[0] as PaymentData;
  if (payment.deletedAt != null) return false;

  db.transact(
    db.tx.payments[params.id].update({
      deletedAt: now(),
      updatedBy: params.updatedBy,
      updatedAt: now(),
    })
  );

  return true;
}

export async function getPayment(id: string): Promise<PaymentData | null> {
  const result = await db.query({
    payments: {
      $: { where: { id } },
    },
  });

  if (result.payments.length === 0) return null;
  return result.payments[0] as PaymentData;
}

export async function queryPaymentsByMonth(
  year: number,
  month: number
): Promise<PaymentData[]> {
  // Month is 1-indexed (1 = January)
  const startOfMonth = new Date(year, month - 1, 1).getTime();
  const endOfMonth = new Date(year, month, 1).getTime();

  const result = await db.query({
    payments: {
      $: {
        where: {
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
          deletedAt: { $isNull: true },
        },
      },
    },
  });

  return result.payments as PaymentData[];
}

export { formatMoney, ALLOWED_NAMES };
