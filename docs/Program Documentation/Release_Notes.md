# CPR Training Management System -- Release Notes

**Application**: [cpr.kpbc.ca](https://cpr.kpbc.ca)
**Operated by**: KPBC

This document summarizes each release of the CPR Training Management System in reverse chronological order.

---

## June 28, 2026 -- Performance, Analytics & Mobile Experience

This release brings year-over-year analytics, WSIB compliance reporting, email notifications for course events, and a fully responsive mobile experience across all portals.

### Features

- **Year-over-year dashboard comparisons** -- Dashboards now show percentage change versus the same period last year for key metrics (courses, students, revenue, and more).
- **Custom date range filters** -- Filter analytics by preset windows (7, 30, or 90 days, past year, or all time) or select a custom range.
- **WSIB compliance reporting** -- A new report in the System Admin portal shows training compliance by organization, with stats for trained, compliant, expiring, and expired employees. Includes CSV export.
- **Audit log viewer** -- System administrators can now browse, filter, and export a full audit trail of user actions (logins, account changes, data modifications).
- **Course status email notifications** -- Participants and organization contacts now receive automatic email notifications when a course is confirmed, cancelled, or completed.
- **Per-organization CSV export** -- Organization portal users can export their own courses, class rosters, and invoices to CSV. System administrators can also export data on a per-organization basis.

### Improvements

- **Responsive design across all portals** -- All eight portals (Admin, System Admin, Instructor, Accountant, Organization, Vendor, HR, and Course Admin) now adapt to phones, tablets, and desktops.
- **Mobile-friendly navigation** -- The sidebar collapses into a hamburger menu on smaller screens.
- **Horizontal table scrolling** -- Data tables scroll horizontally on narrow screens instead of being cut off.

### Quality & Reliability

- **Load testing completed** -- The platform sustained 1,777 requests per second with zero errors under simulated load, supporting approximately 50 to 100 concurrent active users on the current hosting plan.
- **218 automated tests** -- The automated test suite now covers 105 backend and 113 frontend tests, running on every code change.

---

## June 17, 2026 -- Certification Management

This release introduces automated tracking of certification expiry dates and renewal reminder emails.

### Features

- **Certification expiry dashboard** -- A new Certification Tracking page in the System Admin portal displays active, expiring, and expired certifications with color-coded status indicators and adjustable time-window filters.
- **Automated renewal reminder emails** -- The system sends reminder emails to students at 90, 60, and 30 days before their certification expires. Duplicate reminders are prevented automatically.
- **CSV export for certifications** -- Expiring and expired certification lists can be exported to CSV for offline review or reporting.

### Improvements

- **Automatic certificate dates** -- When an instructor marks a student as having attended a course, the certificate issue and expiry dates are now calculated and recorded automatically based on the course type's validity period.
- **Course history shows certification status** -- The student course history view now includes a column showing the certification status for each completed course.

---

## June 16, 2026 -- Student Management

This release adds a centralized student directory and improved data quality tools.

### Features

- **Student master directory** -- System administrators now have a searchable directory of all students across all organizations, with sortable columns and the ability to view each student's full course history.
- **Inline editing** -- Student name, phone, and notes can be edited directly from the directory without opening a separate form.
- **Marketing consent tracking** -- Each student record tracks whether marketing consent has been given, with a toggle to update it.

### Improvements

- **Automatic student deduplication** -- When students are added (via roster upload or instructor entry), the system matches by email address to avoid creating duplicate records.
- **Configurable invoice number sequences** -- Each organization can now have its own invoice numbering format with custom prefixes, date tokens, and reset policies (yearly or monthly).

### Bug Fixes

- **Fixed authentication issue** -- Resolved a problem where all logged-in users were incorrectly logged out due to a database schema mismatch in the token management system.

---

## June 15, 2026 -- Platform Upgrade & Security

This is a major release. The entire backend was rebuilt on a faster, more modern platform, and a comprehensive security audit was completed.

### Improvements

- **Faster backend engine** -- The server was migrated from Express.js to Fastify 5, resulting in improved request handling performance and lower latency.
- **Email delivery upgraded** -- Outgoing emails (password resets, notifications, invoices) now send from noreply@kpbc.ca via a dedicated email delivery service with verified domain authentication.
- **API documentation** -- A live, interactive API reference is now available for developers and integrators at the /api/v1/docs endpoint.
- **Error monitoring** -- The platform now reports server errors to a centralized monitoring service (Sentry) for faster diagnosis and resolution.

### Security

- **Multi-tenant security audit passed** -- All 67 API routes were audited. Nine data-isolation issues were identified and fixed, ensuring that each organization can only access its own data.
- **Penetration testing passed** -- A black-box security test was conducted against the production system. Attempted attacks including unauthorized data access, cross-role escalation, SQL injection, cross-site scripting, and authentication token forgery were all blocked.
- **End-to-end test suite** -- 36 automated browser tests now verify login, navigation, and dashboard functionality for all eight user roles. All 36 tests pass.

---

## June 14, 2026 -- Infrastructure & Staging Environment

This release established the foundation for safe, repeatable deployments.

### Improvements

- **Staging environment launched** -- A separate staging site (stagecprapp.kpbc.ca) is now available for testing changes before they reach production. It automatically deploys the latest code every hour.
- **Automated CI/CD pipeline** -- Every code change now triggers automated type checking and test execution via GitHub Actions before it can be deployed.
- **Database migration system** -- Schema changes are now tracked and applied through a versioned migration system, ensuring consistent database updates across staging and production.

### Quality & Reliability

- **Comprehensive API testing** -- Over 76 read endpoints and 23 write/update/delete operations were tested across all eight portals, along with edge cases for invalid input, expired sessions, and unauthorized access.
- **Six bug fixes** -- Resolved schema mismatches, authentication middleware issues, and query ambiguities discovered during staging validation.

---

*For questions about these changes, contact KPBC support.*
