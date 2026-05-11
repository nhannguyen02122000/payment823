# Design: Add `payment_date` to Payments

## 1. Database Schema (`instant.schema.ts`)

Add `payment_date` as an optional indexed number field to the `payments` entity:

```typescript
payments: i.entity({
  // ...existing fields...
  payment_date: i.number().optional().indexed(),
}),
```

- Stored as Unix timestamp in milliseconds (same convention as `created_at` / `updated_at`)
- Optional — existing payments without this field remain valid

## 2. API — Create (POST) `/api/payments`

- Accept `payment_date` as an optional ISO-8601 string in the request body
- If not provided, default to `Date.now()`
- Store as Unix timestamp; return `payment_date` in the response

## 3. API — Update (PUT) `/api/payments`

- Accept `payment_date` as an optional ISO-8601 string in the request body
- Allow updating `payment_date`; if provided, parse and store as timestamp
- Return `payment_date` in the response

## 4. API — List (GET) `/api/payments?list=true`

- Add query params: `payment_date_from`, `payment_date_to` (ISO strings, parsed same as existing date filters via `parseDateTimeParam`)
- Add `payment_date` to the `validSortFields` array
- Return `payment_date` in each payment object in the response

## 5. API — Summarize (GET) `/api/summarize`

- Change monthly grouping from `created_at` to `payment_date`
- Filter becomes: `p.payment_date >= monthStart && p.payment_date <= monthEnd`
- Payments without `payment_date` are excluded from summarize (consistent with using `payment_date` as the source of truth)

## 6. Frontend — Payment Form (`src/components/payment-form.tsx`)

- Add state: `const [paymentDate, setPaymentDate] = useState(...)`
- On create: default to current datetime-local value
- On edit: pre-populate from `initialValues.payment_date` (format as `YYYY-MM-DDTHH:mm`)
- Add datetime-local input field labeled **"Payment Date & Time"** after the Description field
- Pass `paymentDate` in the request body (empty string if not set, API handles default)
- Update `Payment` type in `types.ts` to include `payment_date?: number`

## 7. Frontend — Listing Page (`src/app/page.tsx`)

- Add filter state: `paymentDateFrom`, `paymentDateTo` (same pattern as `createdFrom`/`createdTo`)
- Add datetime-local filter inputs in the filter bar (e.g., under the existing date range filters)
- Add **"Payment Date"** column header with sort button (sorted by `payment_date`, default order `desc`)
- Add `payment_date` to table columns (hidden on mobile, visible on `md`+)
- Display formatted date in row using existing `formatTimestamp` helper
- Include `paymentDateFrom`/`paymentDateTo` in API request params
- Add to `hasFilters` and `clearFilters`
