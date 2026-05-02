export interface Payment {
  id: string;
  uuid: string;
  name: string;
  money: number;
  description?: string | null;
  created_by: string;
  updated_by: string;
  created_at: number;
  updated_at: number;
}

export interface User {
  id: string;
  username: string;
  avatar_url?: string;
}

export interface ListResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export interface SummarizeResponse {
  moneyPerPerson: Record<string, number>;
  totalMoneySpent: number;
  perPerson: number;
  transfers: Transfer[];
  month: number;
  year: number;
}
