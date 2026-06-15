# Customer Onboarding Guide

## 1. BIZ-1 — SaaS Pricing Model

### Recommended Approach: Manual Invoicing (Phase 1)

For the first 1-5 customers, invoice each organization manually. This avoids building billing infrastructure prematurely and lets you learn what the market will pay.

**How it works:**
- Negotiate price per customer based on their size and needs
- Invoice monthly or quarterly using the app's existing invoice/PDF generation
- Accept payment via e-transfer, cheque, or bank deposit

**Pricing guidelines (starting points — adjust per deal):**
- Small org (1-10 students/mo): $150-300/mo
- Medium org (10-50 students/mo): $300-600/mo
- Large org (50+ students/mo): $600-1200/mo

**Phase 2 (5+ customers):** Formalize into fixed tiers based on patterns from Phase 1 deals.

**Phase 3 (10+ customers):** Add Stripe subscriptions for automated recurring billing if manual invoicing becomes a bottleneck.

---

## 2. BIZ-2 — Offboarding / Cancellation Policy

### Policy (already referenced in Terms of Service)

1. **Notice period**: 30 days written notice required to cancel
2. **Data export window**: Customer has 30 days after cancellation to request a data export (courses, rosters, invoices as CSV/PDF)
3. **Account deactivation**: After the export window, sysadmin sets all org users to `status = 'inactive'`
4. **Data retention**: Data retained for 5 years per PIPEDA/business records requirements, then anonymized
5. **Final invoice**: Pro-rated to cancellation date; no refunds for partial months already paid

### Sysadmin Steps on Churn

1. Receive cancellation notice — log date
2. Send data export offer email to org contact
3. If export requested: run `GET /auth/my-data` for each user or provide CSV dumps
4. After 30-day window: deactivate all org users (`PUT /sysadmin/users/:id` with `status: 'inactive'`)
5. Remove org from active billing
6. Retain records — do NOT delete data (5-year retention)

---

## 4. LEGAL-2 — Customer MSA / Contract

### Required Before First Paying Customer

A Master Service Agreement (MSA) or SaaS Subscription Terms must be signed. Key sections:

1. **Scope of Service**: Access to the CPR Training Management System hosted at cpr.kpbc.ca; includes course scheduling, student management, billing, instructor management, and reporting for the customer's organization
2. **Service Level**: Target 99.5% uptime (excluding scheduled maintenance). UptimeRobot monitoring active. No SLA credits until VPS upgrade (HOSTING-1)
3. **Data Ownership**: Customer owns their data (courses, students, invoices). Provider hosts and processes it on their behalf
4. **Data Processing**: Provider processes personal information under PIPEDA. Privacy policy at /privacy governs data handling
5. **Confidentiality**: Both parties keep confidential information private. Customer data is never shared with other customers or third parties
6. **Payment Terms**: Net 30 from invoice date. Late payments accrue 1.5%/month interest
7. **Term & Renewal**: Month-to-month (or annual with discount). Auto-renews unless 30 days notice given
8. **Cancellation**: Per BIZ-2 policy above — 30-day notice, 30-day export window, then deactivation
9. **Liability Limitation**: Provider liability capped at fees paid in the prior 12 months. No liability for indirect/consequential damages
10. **Acceptable Use**: Customer will not misuse the system, attempt unauthorized access, or use it for unlawful purposes
11. **Modifications**: Provider may update terms with 30 days notice; continued use constitutes acceptance

### Action Items
- [ ] Draft MSA document (use a Canadian SaaS template as starting point)
- [ ] Have a lawyer review before first customer signs
- [ ] Add signature workflow (DocuSign, HelloSign, or PDF + email)

---

## 5. LEGAL-3 — PIPEDA Breach Notification SOP

### Standard Operating Procedure: Data Breach Response

PIPEDA requires notification to the Privacy Commissioner and affected individuals when a breach of personal information creates a "real risk of significant harm."

### Step 1: Detection (Immediate)

**Indicators of a breach:**
- Unauthorized access in audit logs (`audit_log` table)
- Sentry alerts for unusual errors (mass 403s, SQL injection attempts)
- UptimeRobot downtime alert followed by unexpected data changes
- Customer or user reports unauthorized activity
- Server access logs show unknown IPs

**Who detects:** System alerts (Sentry, UptimeRobot) or manual report

### Step 2: Containment (Within 1 hour)

1. Identify the scope — which data, which users, which orgs
2. Revoke compromised sessions (clear `token_blacklist`, force password resets)
3. If server compromised: take app offline (`touch tmp/restart.txt` with maintenance page)
4. Preserve evidence — do NOT delete logs
5. Change database password and API keys if credentials exposed

### Step 3: Assessment (Within 24 hours)

Determine if the breach creates a "real risk of significant harm":
- **What data was exposed?** Names, emails, passwords (hashed), course records, payment info
- **How many individuals affected?**
- **Was data actually accessed/exfiltrated, or just exposed?**
- **Is the data encrypted at rest?** (passwords are bcrypt-hashed; other PII is not encrypted at rest)

### Step 4: Notification (Within 72 hours if reportable)

**If real risk of significant harm exists:**

1. **Privacy Commissioner**: Report to OPC via https://www.priv.gc.ca/en/report-a-concern/report-a-privacy-breach-at-your-organization/
   - Description of the breach
   - Date/time discovered
   - Personal information involved
   - Number of individuals affected
   - Steps taken to contain and mitigate

2. **Affected individuals**: Email notification including:
   - What happened
   - What personal information was involved
   - What you are doing about it
   - What they can do (change passwords, monitor accounts)
   - Contact information for questions

3. **Customer organizations**: Notify org admins of affected organizations directly

### Step 5: Remediation (Within 1 week)

1. Fix the vulnerability that caused the breach
2. Deploy fix to production
3. Conduct post-incident review
4. Update security measures as needed
5. Document everything in an incident report

### Record Keeping

PIPEDA requires maintaining a record of every breach for 24 months, regardless of whether it was reportable. Record:
- Date of breach
- Description
- Data involved
- Number of affected individuals
- Assessment of risk
- Whether OPC was notified
- Remediation steps taken

### Contact Information
- **Privacy Officer**: [Assign a person — likely you as the sole operator]
- **OPC reporting**: https://www.priv.gc.ca/en/report-a-concern/
- **Technical response**: [Your contact info]
