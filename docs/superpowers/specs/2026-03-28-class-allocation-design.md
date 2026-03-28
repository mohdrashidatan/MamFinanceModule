# Class Allocation Script — Design Spec
**Date:** 2026-03-28
**Status:** Approved

---

## Overview

A one-shot Node.js script (`scripts/allocate-classes.js`) that allocates active students to classes by inserting rows into `class_roster`, matched by age group, respecting each class's `classcap`, with random distribution across parallel classes of the same level.

---

## Age-to-Level Mapping

Age is computed as `YEAR(CURDATE()) - YEAR(dob)`.

| Age | Level | Class name pattern |
|-----|-------|--------------------|
| 7   | P1    | `Primary 1 %`       |
| 8   | P2    | `Primary 2 %`       |
| 9   | P3    | `Primary 3 %`       |
| 10  | P4    | `Primary 4 %`       |
| 11  | P5    | `Primary 5 %`       |
| 12  | P6    | `Primary 6 %`       |
| 13  | S1    | `Secondary 1 %`     |
| 14  | S2    | `Secondary 2 %`     |
| 15  | S3    | `Secondary 3 %`     |
| 16  | S4    | `Secondary 4 %`     |
| 17  | PU1   | `Pre-University 1 %`|
| 18  | PU2   | `Pre-University 2 %`|

Students with any other age (e.g., 0, 20, 25) are skipped — no roster entry is created for them.

---

## Allocation Logic

1. **Soft-delete all existing roster entries**
   ```sql
   UPDATE class_roster SET active = 0, is_current = 0, edited_date = NOW()
   ```
   Preserves history; does not hard-delete.

2. **For each level group (age 7–18):**
   - Fetch active classes matching the level name pattern, ordered by `class_id`
   - Fetch all active students of that age, shuffled randomly (Fisher-Yates)
   - Fill classes sequentially: assign students to the first class until `classcap` is reached, then spill into the next class
   - When all classes for a level are full, remaining students are skipped (no error)

3. **Insert `class_roster` rows** with:
   - `class_id`: assigned class
   - `studentid`: student ID
   - `is_current`: 1
   - `start_date`: script run date (today)
   - `active`: 1
   - `entered_by`: 1 (admin user)
   - `entered_date`: NOW()

4. **Print summary** after completion:
   - Per class: class name, assigned count, cap
   - Per level: total assigned, total skipped

---

## Constraints

- Total inserts are bounded by sum of all `classcap` values across active classes
- A student already in the roster (from a prior run) is not detected separately — the soft-delete in step 1 clears the slate before reinserting
- Script is idempotent: re-running produces the same structure (different random distribution each run)

---

## Files

| Path | Purpose |
|------|---------|
| `scripts/allocate-classes.js` | The allocation script |

No new routes, controllers, or models are needed.

---

## Known Data Notes

- 185 students aged 12 vs 70 P6 slots — 115 will be skipped
- 3 students with anomalous ages (0, 20, 25) — skipped
- "Primary 7" classes (class_id 100, 101) are present in DB but have no matching age group — ignored
