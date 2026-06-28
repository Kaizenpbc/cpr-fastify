# Customer Offboarding Runbook

This document defines the step-by-step process for offboarding a customer (organization) from the CPR Training Management System. It covers the full lifecycle from cancellation trigger through data anonymization and internal record-keeping.

**Related documents:** `Customer_Onboarding.md` (BIZ-2 policy), Terms of Service at `/terms`, Privacy Policy at `/privacy`

---

## 1. Trigger — How Offboarding Is Initiated

Offboarding begins when any of the following occurs:

- **Customer request**: Customer submits written cancellation notice (email to support or formal letter)
- **Non-payment**: Invoice unpaid for 60+ days after due date (Net 30 terms + 30-day grace)
- **Contract expiry**: Customer chooses not to renew at end of term (month-to-month or annual)
- **Breach of ToS**: Customer violates acceptable use policy (rare; requires documented evidence)

**Action**: Log the trigger reason, date received, and requesting contact in the internal offboarding record (see Section 7).

---

## 2. Notice Period

Per the Terms of Service and MSA:

- [ ] Confirm 30-day notice period with customer in writing
- [ ] Identify the **last billing date** (end of current billing cycle or 30 days from notice, whichever is later)
- [ ] Issue final invoice, pro-rated to the cancellation date
- [ ] No refunds for partial months already paid
- [ ] Send confirmation email to org contact with:
  - Cancellation effective date
  - Last billing date
  - Data export window (30 days from cancellation date)
  - What happens after the export window closes

---

## 3. Data Export — 30-Day Window

The customer has **30 days from the cancellation date** to download their data. Communicate this clearly in the cancellation confirmation email.

### What Can Be Exported

| Data Type | How to Export | Endpoint / Method |
|-----------|--------------|-------------------|
| Courses | CSV export from Organization Courses page | `GET /org/courses/export` (CSV) |
| Student roster | CSV export from Organization portal | `GET /org/roster/export` (CSV) |
| Invoices | CSV export from Organization Billing page | `GET /org/invoices/export` (CSV) |
| Invoice PDFs | Download individual PDFs from billing page | `GET /org/invoices/:id/pdf` |
| Certificates | Individual certificate PDFs | `GET /org/certificates/:id/pdf` |

### Checklist

- [ ] Send data export offer email to org admin contact on day 1 of the export window
- [ ] If customer requests assistance, sysadmin can generate exports on their behalf using the sysadmin portal CSV export buttons (Organization Management page)
- [ ] Send reminder email at day 20 if no export has been performed
- [ ] Log whether the customer downloaded their data (yes/no, date)

---

## 4. Account Deactivation Steps

Execute these steps **after the 30-day export window closes** (or earlier if customer confirms they are done exporting).

### Pre-Deactivation

- [ ] Send final notice to customer: "Your account will be deactivated on [date]. After this date, users will no longer be able to log in."
- [ ] Allow 5 business days for objections after final notice

### Deactivation Checklist

- [ ] **Disable all org user accounts**: For each user in the organization, set status to inactive via `PUT /sysadmin/users/:id` with `{ "status": "inactive" }`
- [ ] **Set organization status to inactive**: Update the organization record's `status` column to `inactive`
- [ ] **Cancel any scheduled/upcoming courses**: Cancel all future courses for the org that have not yet occurred
- [ ] **Stop automated emails**: Disable certification renewal reminder emails (CertReminderService) for the org's students. Ensure no scheduled course confirmation/cancellation emails will fire for this org.
- [ ] **Remove org from active billing**: Stop any recurring invoicing process for this organization
- [ ] **Verify**: Attempt to log in as an org user to confirm access is blocked

---

## 5. Data Retention and Anonymization

PIPEDA and Canadian tax law require retaining certain records. Do NOT delete data immediately.

### Retention Schedule

| Data Type | Retention Period | Reason |
|-----------|-----------------|--------|
| Course completion records | 7 years from course date | PIPEDA / tax / business records |
| Payment and invoice records | 7 years from transaction date | CRA tax requirements |
| Student records (PII) | 2 years after account closure | PIPEDA retention policy |
| Audit logs | 24 months | PIPEDA breach record requirement |

### Anonymization Steps — After 30-Day Export Window

Execute immediately after the export window closes:

- [ ] **Anonymize PII for all org users**: For each user belonging to the organization, call `DELETE /sysadmin/users/:id/personal-data` — this anonymizes names, emails, phone numbers, and other personally identifiable information while preserving non-PII records (course completions, payment amounts)
- [ ] **Revoke marketing consent**: Set `marketing_consent = false` for all students associated with this organization in the `students` table
- [ ] **Document anonymization date** in the internal offboarding record

### Deferred Anonymization — Student Records

- [ ] At **2 years post-closure**: Anonymize remaining student PII in the `students` table for this org's students
- [ ] At **7 years post-closure**: Course completion and payment records may be purged (verify against CRA requirements before deleting)

### What Is Preserved After Anonymization

- Anonymized course completion records (dates, course types, pass/fail — no student names)
- Anonymized payment/invoice records (amounts, dates — no customer PII)
- Aggregate analytics data

---

## 6. Final Confirmation

After deactivation and initial anonymization are complete:

- [ ] Send confirmation email to the customer's primary contact (use their personal/external email, not the now-disabled org email) confirming:
  - Account has been deactivated
  - Data export window has closed
  - PII has been anonymized per PIPEDA requirements
  - Non-PII records retained per legal obligations (7-year retention for financial/course records)
  - Contact information for any follow-up questions
- [ ] If the customer did not export their data, note this in the email

---

## 7. Internal Records — Offboarding Log

Maintain an internal record for each offboarded customer. Store this in a secure location (e.g., internal spreadsheet or dedicated database table).

| Field | Value |
|-------|-------|
| Organization name | |
| Organization ID | |
| Offboarding trigger | Customer request / Non-payment / Contract expiry / ToS breach |
| Cancellation notice received date | |
| Last billing date | |
| Final invoice number and amount | |
| Data export window start | |
| Data export window end | |
| Customer exported data? | Yes / No (date if yes) |
| Account deactivation date | |
| User PII anonymization date | |
| Marketing consent revoked date | |
| Student PII anonymization due date | 2 years post-closure |
| Full data purge eligible date | 7 years post-closure |
| Reason for churn | Price / Feature gap / Competitor / Business closed / Other: ___ |
| Offboarding completed by | Sysadmin name |
| Confirmation email sent date | |
| Notes | |

---

## Quick Reference — Sysadmin API Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| Disable user | PUT | `/sysadmin/users/:id` with `{ "status": "inactive" }` |
| Anonymize user PII | DELETE | `/sysadmin/users/:id/personal-data` |
| Export org courses (CSV) | GET | Sysadmin portal Organization Management export |
| Export invoices (CSV) | GET | Sysadmin portal Organization Management export |
| View audit log | GET | `/audit-logs` (with org filter) |

---

## Timeline Summary

```
Day 0          Cancellation notice received; log trigger and date
Day 0-1        Send confirmation email with export window details
Day 1-30       Customer data export window (30 days)
Day 20         Send export reminder if no download activity
Day 25         Send final deactivation notice (5 business days warning)
Day 30         Close export window
Day 30-31      Deactivate all org users and org status
                Cancel scheduled courses, stop automated emails
                Anonymize user PII (DELETE /sysadmin/users/:id/personal-data)
                Revoke marketing consent for org students
Day 31         Send final confirmation email to customer
Year 2         Anonymize remaining student PII
Year 7         Purge course/payment records (verify CRA requirements)
```
