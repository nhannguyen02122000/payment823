# payment_date Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional `payment_date` field to the payments entity, wire it through the API and UI with filtering, sorting, and column display.

**Architecture:** A new optional Unix-timestamp field on the payments entity, mirrored through the REST API (create/update/list) and surfaced in the payments page table and form. The summarize endpoint groups by `payment_date` instead of `created_at`.

**Tech Stack:** Next.js (App Router API routes), InstantDB, TypeScript, Tailwind CSS

---

### Task 1: Add `payment_date` to the schema

**Files:**
- Modify: `instant.schema.ts`

- [ ] **Step 1: Add `payment_date` field to payments entity**

In `instant.schema.ts`, add `payment_date: i.number().optional().indexed()` to the `payments` entity after `deleted_at`:

```typescript
payments: i.entity({
  uuid: i.string(),
  name: i.string().indexed(),
  money: i.number(),
  description: i.string().optional(),
  created_by: i.string(),
  updated_by: i.string(),
  created_at: i.number().indexed(),
  updated_at: i.number(),
  deleted_at: i.number().optional(),
  payment_date: i.number().optional().indexed(),  // NEW
}),
```

- [ ] **Step 2: Commit**

```bash
git add instant.schema.ts
git commit -m "feat(payments): add payment_date optional indexed field

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Add `payment_date` to the TypeScript type

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add `payment_date` to `Payment` interface**

In `src/lib/types.ts`, add `payment_date?: number` to the `Payment` interface after `updated_at`:

```typescript
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
  payment_date?: number;  // NEW
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add payment_date to Payment interface

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Update payments API — POST (create)

**Files:**
- Modify: `src/app/api/payments/route.ts`

- [ ] **Step 1: Add `payment_date` to the body type and destructuring**

Find the line:
```typescript
let body: { name?: string; money?: string; description?: string };
```
Change to:
```typescript
let body: { name?: string; money?: string; description?: string; payment_date?: string };
```

Find the line:
```typescript
const { name, money, description } = body;
```
Change to:
```typescript
const { name, money, description, payment_date } = body;
```

- [ ] **Step 2: Parse and default `payment_date`**

After the `moneyNum` validation block, add:
```typescript
const paymentDateMs = payment_date ? Date.parse(payment_date) : Date.now();
```

- [ ] **Step 3: Store `payment_date` in the create transact**

Find the `dbServer.tx.payments[uuid].create({...})` call. Add `payment_date: paymentDateMs` to the created object:
```typescript
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
    payment_date: paymentDateMs,  // NEW
  })
);
```

- [ ] **Step 4: Return `payment_date` in the response**

In the `NextResponse.json` for POST (status 201), add `payment_date: paymentDateMs` to the returned object.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/payments/route.ts
git commit -m "feat(api): handle payment_date in POST /api/payments

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Update payments API — PUT (update)

**Files:**
- Modify: `src/app/api/payments/route.ts`

- [ ] **Step 1: Add `payment_date` to the PUT body type and destructuring**

Find the PUT body type:
```typescript
let body: { uuid?: string; name?: string; money?: string; description?: string };
```
Change to:
```typescript
let body: { uuid?: string; name?: string; money?: string; description?: string; payment_date?: string };
```

Find the PUT destructuring:
```typescript
const { uuid, name, money, description } = body;
```
Change to:
```typescript
const { uuid, name, money, description, payment_date } = body;
```

- [ ] **Step 2: Build the update object dynamically**

Replace the static `update({...})` object in the PUT transact with a computed object. Find the transact call and replace it with:

```typescript
const updateData: Record<string, unknown> = {
  name,
  money: moneyNum,
  description: description ?? null,
  updated_at: now,
  updated_by: username,
};

if (payment_date !== undefined) {
  updateData.payment_date = payment_date ? Date.parse(payment_date) : now;
}

await dbServer.transact(
  dbServer.tx.payments[uuid].update(updateData as any)
);
```

This allows `payment_date` to be omitted (no change) or explicitly set.

- [ ] **Step 3: Return `payment_date` in the PUT response**

Add `payment_date` to the PUT `NextResponse.json` response. Read from the `updateData` object or fall back to `payment?.payment_date`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/payments/route.ts
git commit -m "feat(api): handle payment_date in PUT /api/payments

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Update payments API — GET list (filter + sort + return)

**Files:**
- Modify: `src/app/api/payments/route.ts`

- [ ] **Step 1: Add `payment_date_from` and `payment_date_to` query params**

After the existing `updatedTo` declaration, add:
```typescript
const paymentDateFrom = searchParams.get('payment_date_from');
const paymentDateTo = searchParams.get('payment_date_to');
```

- [ ] **Step 2: Parse them with `parseDateTimeParam`**

Add parsed values after the existing `effectiveUpdatedTo` declaration:
```typescript
const effectivePaymentDateFrom = parseDateTimeParam(paymentDateFrom);
const effectivePaymentDateTo = parseDateTimeParam(paymentDateTo);
```

- [ ] **Step 3: Add filter logic for `payment_date` range**

After the `updated_at` filter block (after `effectiveUpdatedTo != null` check), add:
```typescript
// Filter by payment_date range
if (effectivePaymentDateFrom != null) {
  filtered = filtered.filter((p) => (p.payment_date ?? p.created_at) >= effectivePaymentDateFrom);
}
if (effectivePaymentDateTo != null) {
  filtered = filtered.filter((p) => (p.payment_date ?? p.created_at) <= effectivePaymentDateTo);
}
```

Note: Payments without `payment_date` fall back to `created_at` for filtering.

- [ ] **Step 4: Add `payment_date` to valid sort fields**

Find the `validSortFields` array and add `'payment_date'`:
```typescript
const validSortFields = ['name', 'money', 'created_at', 'updated_at', 'payment_date'];
```

- [ ] **Step 5: Add `payment_date` to `PaymentRow` type**

Add `payment_date?: number | null` to the `PaymentRow` type.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/payments/route.ts
git commit -m "feat(api): add payment_date filter, sort, and return to GET list

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Update summarize API to group by `payment_date`

**Files:**
- Modify: `src/app/api/summarize/route.ts`

- [ ] **Step 1: Add `payment_date` to `Payment` interface**

Add `payment_date?: number | null` to the `Payment` interface.

- [ ] **Step 2: Change the filter to use `payment_date`**

Find the filter line:
```typescript
(p) => p.deleted_at == null && p.created_at >= monthStart && p.created_at <= monthEnd
```
Change to:
```typescript
(p) => p.deleted_at == null && p.payment_date != null && p.payment_date >= monthStart && p.payment_date <= monthEnd
```

Payments without a `payment_date` are excluded from summarize — this is consistent with using `payment_date` as the source of truth.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/summarize/route.ts
git commit -m "feat(summarize): group by payment_date instead of created_at

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Add `payment_date` input to Payment Form

**Files:**
- Modify: `src/components/payment-form.tsx`

- [ ] **Step 1: Add state for `paymentDate`**

After the `description` state line, add:
```typescript
const [paymentDate, setPaymentDate] = useState('');
```

- [ ] **Step 2: Initialize state in useEffect / useEffect-like block for edit mode**

Since there's no useEffect for editing, set initial value in the `useState` call:
```typescript
const [paymentDate, setPaymentDate] = useState(
  initialValues?.payment_date
    ? new Date(initialValues.payment_date).toISOString().slice(0, 16)
    : new Date().toISOString().slice(0, 16)
);
```

- [ ] **Step 3: Pass `payment_date` in the API body**

Find the `body: JSON.stringify({...})` line in `handleSubmit`. Add `payment_date: paymentDate` to the object:
```typescript
body: JSON.stringify({
  name,
  money: moneyInput,
  description,
  payment_date: paymentDate,
  uuid: initialValues?.uuid,
}),
```

- [ ] **Step 4: Add the datetime-local input field**

Add the input field after the Description `div` and before the Error `div`:
```tsx
{/* Payment Date */}
<div className="flex flex-col gap-1.5">
  <label htmlFor="form-payment-date" className="text-sm font-medium text-slate-300">
    Payment Date & Time
  </label>
  <input
    id="form-payment-date"
    type="datetime-local"
    value={paymentDate}
    onChange={(e) => setPaymentDate(e.target.value)}
    className="w-full h-10 px-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
  />
</div>
```

- [ ] **Step 5: Commit**

```bash
git add src/components/payment-form.tsx
git commit -m "feat(form): add payment_date datetime input to PaymentForm

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Add `payment_date` column, sort, and filters to listing page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add filter state**

After `const [createdTo, setCreatedTo] = useState(...)`, add:
```typescript
const [paymentDateFrom, setPaymentDateFrom] = useState('');
const [paymentDateTo, setPaymentDateTo] = useState('');
```

- [ ] **Step 2: Add API params for payment_date filters**

In `fetchPayments`, after the `if (createdTo) params.set(...)` line, add:
```typescript
if (paymentDateFrom) params.set('payment_date_from', paymentDateFrom);
if (paymentDateTo) params.set('payment_date_to', paymentDateTo);
```

- [ ] **Step 3: Add `paymentDateFrom` and `paymentDateTo` to the `useEffect` dependency array**

Add both to the `useCallback` dependency array.

- [ ] **Step 4: Update `clearFilters`**

Add to `clearFilters()`:
```typescript
setPaymentDateFrom('');
setPaymentDateTo('');
```

- [ ] **Step 5: Update `hasFilters`**

Change:
```typescript
const hasFilters = name || moneyMin || moneyMax || createdFrom || createdTo || showAll;
```
To:
```typescript
const hasFilters = name || moneyMin || moneyMax || createdFrom || createdTo || paymentDateFrom || paymentDateTo || showAll;
```

- [ ] **Step 6: Add datetime-local filter inputs in the filter bar**

Add after the existing "Created To" filter div (after line `</div>` of the second date filter column):

```tsx
<div className="flex flex-col gap-1">
  <label htmlFor="f-payment-date-from" className="text-xs font-medium text-slate-400">Payment Date From</label>
  <input
    id="f-payment-date-from"
    type="datetime-local"
    value={paymentDateFrom}
    onChange={(e) => { setPaymentDateFrom(e.target.value); handleFilterChange(); }}
    className="h-9 px-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
  />
</div>

<div className="flex flex-col gap-1">
  <label htmlFor="f-payment-date-to" className="text-xs font-medium text-slate-400">Payment Date To</label>
  <input
    id="f-payment-date-to"
    type="datetime-local"
    value={paymentDateTo}
    onChange={(e) => { setPaymentDateTo(e.target.value); handleFilterChange(); }}
    className="h-9 px-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
  />
</div>
```

Place these inside the second `grid-cols-2` div, alongside the existing Created From/To inputs.

- [ ] **Step 7: Add sort handler for `payment_date`**

The existing `handleSort` function handles all fields by name — no code change needed since `payment_date` is a valid sort field name. The default sort order for `payment_date` will be `desc` (newest first) when the user first clicks the column.

- [ ] **Step 8: Add "Payment Date" column header with sort button**

Find the `Updated` `<th>` and add a new `<th>` after it:
```tsx
<th className="text-left px-4 py-3 font-medium text-slate-400 hidden md:table-cell">
  <button onClick={() => handleSort('payment_date')} className="flex items-center hover:text-slate-200 cursor-pointer">
    Payment Date <SortIcon field="payment_date" sortBy={sortBy} sortOrder={sortOrder} />
  </button>
</th>
```

Place it after the `Updated` `<th>` and before the `Actions` `<th>`.

- [ ] **Step 9: Add `payment_date` cell in table body rows**

Find the `Actions` `<td>` and add a new `<td>` before it:
```tsx
<td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
  {payment.payment_date ? (
    <>
      <div>{formatTimestamp(payment.payment_date)}</div>
      <div className="text-slate-600">{payment.created_by}</div>
    </>
  ) : (
    <span className="italic text-slate-600">—</span>
  )}
</td>
```

- [ ] **Step 10: Update `colSpan` in empty/loading rows**

Find `colSpan={6}` and change to `colSpan={7}` in the "Loading..." and "No payments found." rows.

- [ ] **Step 11: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(ui): add payment_date column, sort, and filters to listing page

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: Build verification

**Files:**
- None (verification only)

- [ ] **Step 1: Run the build**

```bash
cd /Users/nhannguyenthanh/Developer/payment823 && npm run build
```

Expected: No TypeScript errors, successful build.

- [ ] **Step 2: Commit the build fix if needed**

```bash
git add -u && git commit -m "build: fix type errors from payment_date changes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: Push to remote

**Files:**
- None (push only)

- [ ] **Step 1: Push all commits**

```bash
git push
```
