# Invoicing Module Design Spec
**Date:** 2026-03-22
**Project:** FeeFolio Finance — Madrasah School Invoicing
**Database:** primeapp_feefolio
**Status:** Approved by user

---

## 1. Overview

A full invoicing module for a madrasah school of ~630 students. Manages fee billing across 12 academic levels, generates individual invoices per student per fee type, tracks payments (full, partial, advance), applies reductions (grants, scholarships), and produces printable PDF invoices and receipts.

---

## 2. Academic Structure

| Programme | Levels | Code Range |
|-----------|--------|------------|
| Primary | 1–6 | PRI1–PRI6 |
| Secondary | 1–4 | SEC1–SEC4 |
| Pre-University | 1–2 | PRU1–PRU2 |

Students have a `current_level_id` (FK → levels) on their profile, promoted annually by admin at year-end. `students.academic_year_id` represents the **academic year the student is currently enrolled in** — it is updated by admin when a new academic year is activated, so it reflects the student's active enrolment year (not a historical value).

---

## 3. Fee Structure

### Fee Types & Invoice Codes

| Code | Name | Frequency |
|------|------|-----------|
| F | Tuition Fee | Monthly |
| C | CCA Fee | Semi-Annual |
| E | Enhancement Fee | Quarterly (PreU only) |
| M | Miscellaneous Fee | Annual |

### Tuition Rates (monthly, per level group)

| Level Group | Jan–Jun | Jul–Dec |
|-------------|---------|---------|
| Primary 1–6 | $170 | $220 |
| Secondary 1–4 | $180 | $200 |
| PreU 1 | $220 (starts Feb — see note) | $240 |
| PreU 2 | $200 | $220 |

> **PreU 1 "starts Feb" rule:** PreU 1 has no January tuition. This is enforced by **omitting PRU1 from the `billing_calendar_levels` entry for January** — not by a column on `fee_rates` or `levels`. The billing calendar entry for January Tuition simply does not include PRU1 in its eligible levels.

### Tuition Fee Rate Storage

`fee_rates` stores **one row per individual level** (not per level group). For tuition, this means 12 rows per period per academic year (one for each of PRI1–PRI6, SEC1–SEC4, PRU1, PRU2). Levels within the same group (e.g., Primary 1–6) share the same amount but have separate rows referencing their individual `level_id`. The `feeRuleService` joins: `students.current_level_id = fee_rates.level_id` to resolve the amount for each student.

### CCA Fees

| Semester | Amount | Billing Month | Eligible Levels |
|----------|--------|---------------|-----------------|
| Sem 1 | $50 | March | All levels |
| Sem 2 | $50 | July | Pri 1–5, Sec 1–3, PreU 1, PreU 2 (Pri 6 & Sec 4 excluded) |

### Enhancement Fee (PreU only)

| Quarter | Amount | Billing Month |
|---------|--------|---------------|
| Q1 | $50 | February |
| Q2 | $50 | April |
| Q3 | $50 | August |
| Q4 | $50 | October |

### Miscellaneous Fee
- $120 — all levels — billed once per academic year

---

## 4. Invoice Numbering

Format: `YYMM[Type]-[StudentID]`

Examples:
- `2601F-292393` = January 2026 Tuition Fee, student 292393
- `2603C-292393` = March 2026 CCA Fee, student 292393
- `2602E-292393` = February 2026 Enhancement Fee, student 292393
- `2601M-292393` = January 2026 Miscellaneous Fee, student 292393

Invoice numbers are unique per student per fee type per billing period. Enforced by:
1. UNIQUE constraint on `invoices.invoice_no`
2. Composite UNIQUE constraint on `invoices(student_id, fee_type_id, billing_calendar_id)`
3. Application-level check in `feeRuleService` before generating

---

## 5. Database Schema

### Approach: Structured Rule Tables + Service Layer (Approach C)

All fee rules, rates, and billing calendar entries stored in relational tables. A `FeeRuleService` on the backend resolves eligibility and amounts at runtime.

### 5.1 Lookup Tables (New)

#### `academic_years`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| year | YEAR | e.g. 2026 |
| label | VARCHAR | e.g. "AY 2026" |
| is_active | TINYINT | Only one row active at a time |
| start_date | DATE | |
| end_date | DATE | |

#### `levels`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| code | VARCHAR | PRI1–PRU2 |
| name | VARCHAR | e.g. "Primary 1" |
| programme | ENUM | PRIMARY, SECONDARY, PREUNIVERSE |
| sort_order | INT | |
| is_active | TINYINT | |

#### `fee_types`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| code | CHAR(1) | F, C, E, M |
| name | VARCHAR | e.g. "Tuition Fee" |
| frequency | ENUM | MONTHLY, SEMI_ANNUAL, QUARTERLY, ANNUAL |
| description | TEXT | |
| is_active | TINYINT | |

#### `fee_rates`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| fee_type_id | INT FK | → fee_types |
| academic_year_id | INT FK | → academic_years |
| level_id | INT FK | → levels (one row per individual level) |
| period | ENUM | JAN_JUN, JUL_DEC, SEM1, SEM2, Q1, Q2, Q3, Q4, ANNUAL |
| amount | DECIMAL(10,2) | |

#### `billing_calendar`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| academic_year_id | INT FK | → academic_years |
| fee_type_id | INT FK | → fee_types |
| billing_month | TINYINT | 1–12 |
| billing_year | YEAR | |
| period | ENUM | Maps to fee_rates.period |
| due_date | DATE | |
| is_processed | TINYINT | 0=open, 1=locked after batch ISSUED. Set back to 0 only if all batches for this entry are VOID |

> **Re-generation after void:** If a batch is voided, `billing_calendar.is_processed` is reset to 0, allowing the wizard to re-generate. The duplicate check on `invoice_no` and the composite UNIQUE on `invoices` still prevent re-invoicing individual students who were not cancelled.

#### `billing_calendar_levels` (junction)
| Column | Type | Notes |
|--------|------|-------|
| billing_calendar_id | INT FK | → billing_calendar |
| level_id | INT FK | → levels |

#### `counter_items`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| code | VARCHAR | ZAKAT, FITRAH, DONATION, ITEM, etc. |
| name | VARCHAR | |
| default_amount | DECIMAL(10,2) | Nullable |
| is_fixed_price | TINYINT | 1=fixed, 0=user enters amount |
| is_active | TINYINT | |

### 5.2 Existing Tables (Extended)

#### `students` — add 2 columns
- `current_level_id` INT FK → levels (the student's current academic level)
- `academic_year_id` INT FK → academic_years (the academic year the student is currently enrolled in; updated by admin at year-start)

#### `receipts` — add columns
- `total_amount` DECIMAL(10,2) — total of all line items collected
- `credit_applied` DECIMAL(10,2) DEFAULT 0.00 — amount of student credit wallet applied in this receipt (for receipt PDF and audit)
- `payment_method` ENUM (CASH, PAYNOW, GIRO, CHEQUE)
- `paid_at` DATETIME
- `created_by` INT FK → users

> **Note:** `receipts` does NOT get a single `invoice_id` column. A receipt can cover multiple invoices. The invoice-to-receipt relationship is expressed entirely through `receipt_items.invoice_id`. Queries filtering receipts by invoice join through `receipt_items`.

### 5.3 Invoice Tables (New)

#### `invoice_batches`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| batch_no | VARCHAR UNIQUE | |
| billing_calendar_id | INT FK | → billing_calendar |
| academic_year_id | INT FK | → academic_years (denormalised for fast filtering) |
| total_invoices | INT | |
| total_amount | DECIMAL(10,2) | |
| status | ENUM | DRAFT, ISSUED, VOID |
| created_by | INT FK | → users |
| created_at | DATETIME | |

#### `invoices`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| invoice_no | VARCHAR UNIQUE | Format: YYMM[Type]-[StudentID] |
| student_id | INT FK | → students |
| fee_type_id | INT FK | → fee_types |
| batch_id | INT FK | → invoice_batches |
| billing_calendar_id | INT FK | → billing_calendar (for fast duplicate checking) |
| amount | DECIMAL(10,2) | Original amount before any reductions |
| amount_after_reduction | DECIMAL(10,2) | Amount after grants/adjustments are applied |
| amount_paid | DECIMAL(10,2) | Running total of payments received (updated on each receipt) |
| status | ENUM | ISSUED, PARTIAL, PAID, CANCELLED |
| due_date | DATE | |
| issued_at | DATETIME | |

> **`balance_due` is NOT stored** — it is always computed on read as `amount_after_reduction − amount_paid`. This avoids dual-write consistency issues. The query layer calculates it in SELECT statements. `invoiceModel.js` always returns it as a computed expression.

> **Composite UNIQUE constraint:** `UNIQUE KEY uq_invoice_period (student_id, fee_type_id, billing_calendar_id)` — enforces at DB level that a student cannot have two invoices of the same fee type for the same billing calendar entry.

> **Invoice immutability:** Once issued, invoices are immutable except via:
> - `invoice_adjustments` (grants/reductions)
> - `receipts` (payments updating `amount_paid` and `status`)
> - Cancellation (sets status to CANCELLED)
> There is no general PATCH endpoint for invoices. Corrections require cancellation and re-issue.

#### `invoice_adjustments`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| invoice_id | INT FK | → invoices |
| type | ENUM | GRANT, SCHOLARSHIP, BURSARY, REFUND, OVERPAYMENT_CREDIT |
| amount | DECIMAL(10,2) | Reduction value (positive number) |
| description | VARCHAR | e.g. "MOE Grant" |
| applied_by | INT FK | → users |
| applied_at | DATETIME | |

> Applying an adjustment: in one transaction — insert into `invoice_adjustments`, then update `invoices.amount_after_reduction = GREATEST(0, amount_after_reduction - adjustment.amount)`, then recalculate status. Adjustments may NOT reduce `amount_after_reduction` below zero. If an adjustment exceeds the remaining balance, it is capped at the current `amount_after_reduction` value. Any excess is NOT automatically credited to the student's credit wallet — the admin must decide separately.

### 5.4 Receipt Tables (New)

#### `receipt_items`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| receipt_id | INT FK | → receipts |
| item_type | ENUM | INVOICE, COUNTER_ITEM |
| invoice_id | INT FK | → invoices (nullable — populated when item_type = INVOICE) |
| counter_item_id | INT FK | → counter_items (nullable — populated when item_type = COUNTER_ITEM) |
| description | VARCHAR | |
| quantity | INT | Default 1 |
| unit_price | DECIMAL(10,2) | |
| amount | DECIMAL(10,2) | |

#### `student_credit_ledger`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| student_id | INT FK | → students |
| type | ENUM | ADVANCE, OVERPAYMENT, REFUND_ISSUED, CREDIT_APPLIED |
| amount | DECIMAL(10,2) | Positive = credit in, Negative = credit out |
| receipt_id | INT FK | → receipts (nullable) |
| invoice_id | INT FK | → invoices (nullable) |
| description | VARCHAR | |
| created_at | DATETIME | |

> Student credit balance = `SUM(amount)` across all ledger rows for that student.

**Total: 15 tables** — 6 new lookup, 4 new invoice/batch/adjustment/receipt_items, 1 new credit ledger, 2 existing extended (students, receipts).

---

## 6. Backend Architecture

**Pattern:** Follows existing Express + raw SQL pattern exactly.
`Route → authMiddleware → validateSchema → Controller → Service → Model → MySQL Pool`
All responses normalized by existing `responseHandler.js`.

### New Files

#### Routes (`server/src/routes/`)
- `invoiceRoutes.js` — invoice CRUD + preview + generate + PDF download
- `lookupRoutes.js` — CRUD for all 6 lookup tables
- `receiptRoutes.js` *(extend)*

> **Route ordering in `invoiceRoutes.js`:** Static-segment routes MUST be registered before parameterised routes to avoid Express shadowing. Order must be:
> 1. `POST /invoices/preview`
> 2. `POST /invoices/generate`
> 3. `GET /invoices/student/:studentId/outstanding`
> 4. `GET /invoices/batch/:batchId/pdf`
> 5. `GET /invoices/:id` (last)

#### Controllers (`server/src/controllers/`)
- `invoiceController.js` — thin, delegates to InvoiceService
- `lookupController.js` — generic CRUD for lookup tables (table name validated against an explicit allowlist to prevent SQL injection; allowlist mapping: `"academic-years"→academic_years`, `"levels"→levels`, `"fee-types"→fee_types`, `"fee-rates"→fee_rates`, `"billing-calendar"→billing_calendar`, `"counter-items"→counter_items`)
- `receiptController.js` *(extend)*

#### Services (`server/src/services/`)
- `feeRuleService.js` — **core engine**: given a `billing_calendar_id`, resolves eligible students (via `billing_calendar_levels → students.current_level_id`), fee rate per student (via `fee_rates` join on `level_id`), and invoice number to generate; enforces duplicate check
- `invoiceService.js` — orchestrates batch generation; wraps in DB transaction (create batch → create invoices); rolls back on any failure; sets `billing_calendar.is_processed = 1` on success
- `pdfService.js` — PDF generation via **pdfkit** (server-side, no headless browser); supports single invoice PDF and batch merged PDF
- `receiptService.js` *(extend)* — creates receipt + receipt_items (one row per invoice paid, one per counter item) + updates `invoices.amount_paid` and `status` + writes `student_credit_ledger` rows for credit applied — all in one DB transaction

#### Models (`server/src/models/`)
- `invoiceModel.js` — insert batch/invoices; duplicate check via composite unique; list with filters; always computes `balance_due` as `amount_after_reduction − amount_paid` in SELECT
- `lookupModel.js` — generic CRUD; table name validated against allowlist
- `feeRateModel.js` — resolves `fee_rates + billing_calendar + billing_calendar_levels` for a billing run
- `receiptModel.js` *(extend)* — insert receipt_items, update invoice amounts and status

### New API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/invoices | List invoices (filterable by status, fee type, level, month) |
| POST | /api/invoices/preview | Preview eligible students for a billing run |
| POST | /api/invoices/generate | Generate invoice batch |
| GET | /api/invoices/student/:studentId/outstanding | All ISSUED/PARTIAL invoices for a student |
| GET | /api/invoices/batch/:batchId/pdf | Download batch PDF |
| GET | /api/invoices/:id | Single invoice detail (includes computed balance_due) |
| PATCH | /api/invoices/:id/cancel | Cancel invoice — soft-cancel (sets status = CANCELLED, record is NOT deleted) |
| POST | /api/invoices/:id/adjustments | Apply grant/scholarship/bursary/refund |
| CRUD | /api/lookup/academic-years | Academic year management |
| CRUD | /api/lookup/levels | Level management |
| CRUD | /api/lookup/fee-types | Fee type management |
| CRUD | /api/lookup/fee-rates | Fee rate management |
| CRUD | /api/lookup/billing-calendar | Billing calendar management |
| CRUD | /api/lookup/counter-items | Counter item management |
| POST | /api/receipts | Create receipt — payload: `{ studentId, selectedInvoices: [{invoiceId, payAmount}], counterItems: [{counterItemId, quantity, unitPrice}], paymentMethod, creditToApply, advanceAmount }` |
| GET | /api/receipts/:id/pdf | Receipt PDF |
| GET | /api/students/:id/credit | Student credit balance (SUM from ledger) |

---

## 7. Frontend Architecture

**Stack:** React + Vite, shadcn/ui (new-york), Axios interceptors, react-hot-toast.

### Sidebar Changes

**Financial group** (existing) — add:
- Invoices *(new, resource: INVOICES)*

**Configuration group** (new) — add:
- Academic Years
- Fee Management (fee types + rates)
- Billing Calendar
- Counter Items

### New Pages & Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| /invoices | InvoicesPage.jsx | Invoice list, filter by status/type/level/month |
| /invoices/generate | InvoiceGeneratePage.jsx | 4-step generation wizard |
| /invoices/:id | InvoiceDetailPage.jsx | Invoice detail + payment form |
| /lookup/academic-years | LookupPage.jsx (reused) | Academic year CRUD |
| /lookup/fee-management | FeeManagementPage.jsx | Fee types + rates (tabbed) |
| /lookup/billing-calendar | BillingCalendarPage.jsx | Calendar grid view |
| /lookup/counter-items | LookupPage.jsx (reused) | Counter item CRUD |

### Invoice Generation Wizard (4 steps)

1. **Select Period** — calendar grid shows all `billing_calendar` entries for the active academic year; each cell shows fee types due that month; user clicks a fee type cell to proceed; processed entries (is_processed=1) shown as locked/greyed
2. **Review Students** — table of eligible students (from `billing_calendar_levels → students`); filter tabs (All / Primary / Secondary / PreU); remove individual students (with optional reason); removed students shown struck-through with Restore option; running count of invoices remaining
3. **Confirm** — summary: total invoices, total amount, breakdown by level; Generate button triggers `POST /api/invoices/generate`
4. **Download** — success state; download batch PDF button; link back to invoices list

### Payment Form (Invoice Detail Page)

- **Student header** — name, student no., level, credit balance badge (from `GET /api/students/:id/credit`)
- **Outstanding invoices table** — all ISSUED/PARTIAL invoices from `GET /api/invoices/student/:studentId/outstanding`; checkboxes to select which to pay; each row shows original amount, reduction tags, balance due, editable "pay now" field (for partial payment)
- **Advance payment input** — optional top-up to credit wallet (creates ADVANCE ledger entry)
- **Apply credit toggle** — shows available balance; checkbox to apply against selected invoices (deducted from cash to collect)
- **Counter items** — optional Zakat, Fitrah, Donation, Item Purchases
- **Payment method selector** — Cash, PayNow, Giro, Cheque
- **Live summary panel** — invoice balances + reductions + credit applied + counter items + total cash to collect
- **Confirm button** — calls `POST /api/receipts`; receipt service handles all updates atomically

---

## 8. Payment & Credit Logic

### Invoice Status Flow
```
ISSUED → PARTIAL → PAID
ISSUED → CANCELLED
```

### Balance Due
Computed on read: `amount_after_reduction − amount_paid`. Never stored. Always returned by `invoiceModel` as a SQL expression in SELECT.

### Credit Ledger
- Credits IN: advance payment (ADVANCE), overpayment (OVERPAYMENT), admin-issued refund (REFUND_ISSUED)
- Credits OUT: applied toward invoice payment at counter (CREDIT_APPLIED, negative amount)
- Balance = `SUM(amount)` for the student across all ledger rows
- `receipts.credit_applied` stores the credit amount used in that receipt for easy PDF rendering without a re-join to the ledger

### Adjustments
- Grants, scholarships, bursaries recorded as `invoice_adjustments` rows
- Applying an adjustment: in one transaction, insert into `invoice_adjustments`, update `invoices.amount_after_reduction`, update `invoices.status` if fully covered
- Shown as coloured tags on invoice detail and payment form

### Partial Payment
- User enters custom "pay now" amount per invoice (must be ≤ balance_due)
- `receiptService` updates `invoices.amount_paid += payment_amount` and recalculates status (PARTIAL if balance_due > 0, PAID if = 0)

### Duplicate Prevention
- `UNIQUE KEY uq_invoice_no (invoice_no)` — enforces uniqueness of invoice number
- `UNIQUE KEY uq_invoice_period (student_id, fee_type_id, billing_calendar_id)` — enforces one invoice per student per fee type per billing period at DB level
- Application-level: `feeRuleService` pre-checks for existing invoices and excludes those students from batch generation (skips, does not error the whole batch)

---

## 9. PDF Output

### Invoice PDF (per student)
- School name, address, contact
- Invoice number, issue date, due date
- Bill To: student name, student no., parent name (resolved by querying the `contacts` or `parents` table linked to the student; if multiple parents/contacts, use the one flagged as primary contact; exact column names must be verified against the live DB schema before `pdfService.js` is coded — query the `contacts` table via `student_id` and a `is_primary = 1` or equivalent flag)
- Invoice Details: level, period
- Line items table: description, period, amount
- Reduction section: lists adjustments (grant name, amount)
- Total after reductions
- Payment instructions (PayNow UEN, counter details)
- Footer: "Computer-generated invoice"

### Receipt PDF
- Receipt number, date
- Student name, student no.
- Itemized list: invoice payments (one row per invoice in `receipt_items`) + counter items
- Credit applied (from `receipts.credit_applied`)
- Payment method, total collected

### PDF Generation
- Library: **pdfkit** (server-side, no headless browser needed)
- Batch: all invoices in a run merged into single PDF
- Single: individual invoice or receipt PDF on demand

---

## 10. Permission System

New resources to register in the existing permission system:

| Resource | Actions | Notes |
|----------|---------|-------|
| INVOICES | read, create, update, delete | Invoice generation, management, PDF |
| LOOKUP | read, create, update, delete | All configuration/lookup tables |
| RECEIPTS | read, create | Existing resource — extend with `create` action if not already present |

---

## 11. Academic Year Activation & Student Re-enrolment

When admin activates a new academic year (via `PUT /api/lookup/academic-years/:id` with `is_active: true`), a **bulk update** is needed to set `students.academic_year_id` to the new year for all active students. This is handled as a side effect in `lookupController`/`lookupModel` when `is_active = 1` is set on an academic year:

1. Deactivate the currently active year (`is_active = 0`)
2. Activate the new year (`is_active = 1`)
3. Bulk update `students.academic_year_id = newYearId` WHERE student is active

Student level promotion (`current_level_id`) is done separately by admin — either individually through the student record or via a future bulk-promote endpoint (out of scope for this phase).

---

## 12. Out of Scope (for this phase)

- Automated invoice generation (cron/scheduled triggers) — manual wizard only
- Email/SMS delivery of invoices — printable PDF only
- Giro auto-debit processing — Giro is a payment method label only
- Student promotion automation — admin manually promotes at year-end
- Multi-school/branch support
