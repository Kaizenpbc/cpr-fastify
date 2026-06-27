# API Reference

Base URL: `/api/v1`

All endpoints require authentication unless noted. Send access token via `Authorization: Bearer <token>` header.

---

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Login with username/password |
| POST | `/auth/refresh` | Cookie | Rotate access + refresh tokens |
| GET | `/auth/me` | Yes | Get current user profile |
| POST | `/auth/logout` | Yes | Logout and blacklist token |
| POST | `/auth/change-password` | Yes | Change password |

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Backend health check |

---

## Courses

Role: `organization`, `admin`, `courseadmin`

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/courses/request` | organization | Create course request |
| GET | `/courses/org/students/:courseId` | organization | List students for a course |
| POST | `/courses/org/students/:courseId` | organization | Upload student roster |
| GET | `/courses/pending` | admin | List pending course requests |
| GET | `/courses/confirmed` | admin | List confirmed courses |
| GET | `/courses/completed` | admin | List completed courses |
| GET | `/courses/cancelled` | admin | List cancelled courses |
| PUT | `/courses/:id/assign-instructor` | admin | Assign instructor to course |
| PUT | `/courses/:id/cancel` | admin | Cancel a course |
| PUT | `/courses/:id/schedule` | admin | Schedule a course |
| POST | `/courses/:id/update-reminder` | admin | Send reminder notification |
| GET | `/courses/:id/students` | admin | Get course roster |
| GET | `/courses/:id/validate-billing` | admin | Validate billing readiness |
| PUT | `/courses/:id/ready-for-billing` | admin | Mark course ready for billing |

---

## Accounting

Role: `accountant`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/accounting/dashboard` | Financial dashboard stats |
| GET | `/accounting/billing-queue` | Courses ready for billing |
| GET | `/accounting/course-pricing` | List pricing rules |
| POST | `/accounting/course-pricing` | Create pricing rule |
| PUT | `/accounting/course-pricing/:id` | Update pricing rule |
| DELETE | `/accounting/course-pricing/:id` | Delete pricing rule |
| POST | `/accounting/invoices` | Generate invoice |
| GET | `/accounting/invoices` | List invoices |
| GET | `/accounting/invoices/pending-approval` | Invoices awaiting approval |
| GET | `/accounting/invoices/rejected` | Rejected invoices |
| GET | `/accounting/invoices/:id` | Invoice detail |
| PUT | `/accounting/invoices/:id/approval` | Approve/reject invoice |
| PUT | `/accounting/invoices/:id/resubmit` | Resubmit rejected invoice |
| PUT | `/accounting/invoices/:id/fix-calculations` | Fix invoice calculations |
| PUT | `/accounting/invoices/:id/post-to-org` | Post invoice to organization |
| GET | `/accounting/invoices/:id/payments` | List payments for invoice |
| POST | `/accounting/invoices/:id/payments` | Record payment |
| GET | `/accounting/invoices/:id/pdf` | Download invoice PDF |
| GET | `/accounting/invoices/:id/preview` | Preview invoice |
| GET | `/accounting/organizations` | List organizations |
| GET | `/accounting/course-types` | List course types |
| GET | `/accounting/reports/revenue` | Revenue report |
| GET | `/accounting/reports/ar-aging` | AR aging report |
| GET | `/accounting/aging-report` | Aging report (alt) |
| GET | `/accounting/invoice-sequences` | All invoice sequences |
| GET | `/accounting/invoice-sequences/:orgId` | Org invoice sequence |
| GET | `/accounting/invoice-sequences/:orgId/preview` | Preview next number |
| PUT | `/accounting/invoice-sequences` | Update sequence config |
| DELETE | `/accounting/invoice-sequences/:orgId` | Delete org sequence |

---

## Organization

Role: `organization`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/organization/profile` | Get own org profile |
| PUT | `/organization/profile` | Update own org profile |
| GET | `/organization/courses` | List own courses |
| GET | `/organization/archive` | Archived courses |
| GET | `/organization/dashboard` | Org dashboard stats |
| POST | `/organization/course-request` | Request a new course |

### Organization Billing

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/organization/invoices` | organization | List own invoices |
| GET | `/organization/invoices/:id` | organization | Invoice detail |
| GET | `/organization/payment-history` | organization | Payment history |
| POST | `/organization/invoices/:id/payment-submission` | organization | Submit payment |
| GET | `/accounting/organization-invoices` | accountant | All org invoices |
| PUT | `/accounting/organization-invoices/:id/paid` | accountant | Mark invoice paid |

---

## HR

Role: `hr`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hr/dashboard` | HR dashboard stats |
| GET | `/hr/instructors` | List instructors (search, paginate) |
| GET | `/hr/organizations` | List organizations |
| GET | `/hr/profile-changes` | Pending profile changes |
| POST | `/hr/profile-changes/:changeId/approve` | Approve/reject change |
| GET | `/hr/user/:userId` | User profile detail |
| GET | `/hr/returned-payment-requests` | Returned payment requests |
| POST | `/hr/returned-payment-requests/:requestId/process` | Override/reject payment |

### Profile Changes (any authenticated user)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/profile-changes` | Submit profile change request |
| GET | `/profile-changes` | Get own change requests |

---

## Instructor

Role: `instructor`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/instructor/dashboard/stats` | Dashboard statistics |
| GET | `/instructor/classes` | All classes |
| GET | `/instructor/upcoming-classes` | Upcoming classes |
| GET | `/instructor/completed-classes` | Completed classes |
| POST | `/instructor/availability` | Set availability |
| PUT | `/instructor/availability` | Update availability |
| GET | `/instructor/schedule` | View schedule |

---

## Timesheets

Role: `instructor`, `hr`

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/timesheet/stats` | hr | Timesheet statistics |
| GET | `/timesheet` | any | List timesheets |
| GET | `/timesheet/:id` | any | Timesheet detail |
| POST | `/timesheet` | instructor | Submit timesheet |
| PUT | `/timesheet/:id/approve` | hr | Approve timesheet |
| POST | `/timesheet/:id/add-note` | hr | Add note |
| DELETE | `/timesheet/:id` | instructor | Delete timesheet |

---

## Pay Rates

Role: `hr`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/pay-rates/tiers` | List pay rate tiers |
| POST | `/pay-rates/tiers` | Create tier |
| PUT | `/pay-rates/tiers/:id` | Update tier |
| GET | `/pay-rates/instructors` | All instructor rates |
| GET | `/pay-rates/instructors/:instructorId` | Instructor rate |
| POST | `/pay-rates/instructors/:instructorId` | Set rate |
| PUT | `/pay-rates/instructors/:instructorId` | Update rate |
| POST | `/pay-rates/bulk-update` | Bulk update rates |
| GET | `/pay-rates/history/:instructorId` | Rate history |

---

## Payroll

Role: `hr`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/payroll/stats` | Payroll statistics |
| GET | `/payroll/payments` | List payments |
| GET | `/payroll/payments/:paymentId` | Payment detail |
| POST | `/payroll/calculate/:instructorId` | Calculate payment |
| POST | `/payroll/payments` | Create payment |
| PUT | `/payroll/payments/:paymentId/approve` | Approve payment |
| DELETE | `/payroll/payments/:paymentId` | Delete payment |

---

## Vendor

Role: `vendor`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vendor/vendors` | List vendors |
| GET | `/vendor/profile` | Get vendor profile |
| PUT | `/vendor/profile` | Update vendor profile |
| GET | `/vendor/invoices` | List own invoices |
| GET | `/vendor/invoices/:id` | Invoice detail |
| POST | `/vendor/invoices` | Upload invoice (PDF) |
| POST | `/vendor/invoices/:id/resend` | Resend invoice |
| GET | `/vendor/invoices/:id/download` | Download invoice file |

### Vendor Admin (admin-side)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/vendor-invoices` | All vendor invoices |
| GET | `/admin/vendor-invoices/ready-for-processing` | Ready for processing |
| PUT | `/admin/vendor-invoices/:id/notes` | Add notes |
| POST | `/admin/vendor-invoices/:id/approve` | Approve invoice |
| POST | `/admin/vendor-invoices/:id/payment` | Record payment |
| GET | `/admin/vendor-invoices/:id/audit` | Audit trail |

---

## System Admin

Role: `sysadmin`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sysadmin/courses` | List course types |
| POST | `/sysadmin/courses` | Create course type |
| PUT | `/sysadmin/courses/:id` | Update course type |
| DELETE | `/sysadmin/courses/:id` | Delete course type |
| GET | `/sysadmin/users` | List users |
| POST | `/sysadmin/users` | Create user |
| PUT | `/sysadmin/users/:id` | Update user |
| GET | `/sysadmin/organizations` | List organizations |
| POST | `/sysadmin/organizations` | Create organization |
| GET | `/sysadmin/vendors` | List vendors |
| POST | `/sysadmin/vendors` | Create vendor |
| PUT | `/sysadmin/vendors/:id` | Update vendor |

---

## Course Admin

Role: `courseadmin`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/courseadmin/instructors` | List available instructors |
| POST | `/courseadmin/courses/:id/schedule` | Schedule course |

---

## Notifications

Role: any authenticated

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | List notifications |
| GET | `/notifications/unread-count` | Unread count |
| POST | `/notifications/:id/read` | Mark as read |
| POST | `/notifications/mark-all-read` | Mark all read |
| DELETE | `/notifications/:id` | Delete notification |
| GET | `/notifications/preferences` | Get preferences |
| PUT | `/notifications/preferences` | Update preferences |

---

## Organization Pricing

| Method | Path | Description |
|--------|------|-------------|
| GET | `/organization-pricing/organization/:organizationId` | Org pricing rules |
| GET | `/organization-pricing/course-pricing/:organizationId/:classTypeId` | Specific pricing |
| POST | `/organization-pricing/calculate-cost` | Calculate course cost |

---

## Email Templates

Role: `superadmin`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/email-templates` | List templates |
| GET | `/email-templates/:id` | Template detail |
| POST | `/email-templates` | Create template |
| PUT | `/email-templates/:id` | Update template |
| DELETE | `/email-templates/:id` | Delete template |
| POST | `/email-templates/:id/preview` | Preview rendered template |
| POST | `/email-templates/:id/clone` | Clone template |
| POST | `/email-templates/:id/test-send` | Send test email |

---

## Colleges

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/colleges` | any | List colleges |
| GET | `/colleges/all` | admin | List all colleges |
| POST | `/colleges` | admin | Create college |
| PUT | `/colleges/:id` | admin | Update college |
| DELETE | `/colleges/:id` | admin | Delete college |

---

## Misc

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/course-types` | Yes | List course types |
| GET | `/classes` | Yes | List classes |
| GET | `/instructors` | Yes | List instructors |
| GET | `/dashboard` | Yes | General dashboard |

---

## Real-time Events

| Method | Path | Description |
|--------|------|-------------|
| GET | `/events` | SSE stream (keep-alive every 30s) |

## Error Reporting

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/client-errors` | No | Frontend error collector (rate-limited) |
