# Acceptable Use Policy

**CPR Training Management System**
**Kaizen Performance Business Consulting (KPBC)**

| Field             | Value                          |
|-------------------|--------------------------------|
| **Version**       | 1.0                            |
| **Effective Date**| 2026-06-28                     |
| **System**        | cpr.kpbc.ca                    |

---

## 1. Purpose

This Acceptable Use Policy ("AUP") defines the acceptable and prohibited uses of the CPR Training Management System ("the System") operated by Kaizen Performance Business Consulting ("KPBC", "the Provider"). This policy supplements the Master Service Agreement ("MSA") between KPBC and each customer organization and applies to all users of the System.

---

## 2. Scope

This AUP applies to all authorized users of the System, including but not limited to:

- Customer organization administrators
- Instructors
- Office staff
- Students (where they have direct system access)
- KPBC system administrators

This policy governs use of the System accessed via cpr.kpbc.ca, including all application features, APIs, and associated services.

---

## 3. Acceptable Use

The System is provided for the following intended business purposes:

- **Course management**: Creating, scheduling, editing, and cancelling training courses
- **Student record keeping**: Enrolling students, recording attendance, managing student profiles
- **Certification tracking**: Issuing, recording, and verifying training certifications
- **Instructor management**: Assigning instructors to courses, managing instructor profiles and availability
- **Billing and invoicing**: Generating invoices, recording payments, managing financial records related to training services
- **Reporting**: Generating reports on courses, students, revenue, and operational metrics
- **Organization administration**: Managing users, roles, and organizational settings within the customer's own organization

Users shall use the System in a manner consistent with these intended purposes, applicable laws, and the terms of the MSA.

---

## 4. Prohibited Use

The following activities are strictly prohibited:

### 4.1 Unauthorized Access

- Accessing or attempting to access data belonging to other customer organizations
- Attempting to escalate privileges beyond the user's assigned role (e.g., accessing sysadmin or admin functions as a regular user)
- Accessing or attempting to access accounts belonging to other users
- Bypassing or attempting to bypass authentication, authorization, or access control mechanisms

### 4.2 Credential Sharing

- Sharing login credentials (username and password) with any other person
- Using another person's credentials to access the System
- Creating shared or generic accounts unless explicitly authorized by the Provider

### 4.3 Malicious Content and Activity

- Uploading, transmitting, or introducing malware, viruses, trojans, worms, or any other malicious code
- Uploading or executing scripts, code, or automated tools designed to exploit, damage, or interfere with the System
- Attempting SQL injection, cross-site scripting (XSS), or any other attack against the System
- Intentionally corrupting or destroying data within the System

### 4.4 Unlawful Use

- Using the System for any purpose that violates applicable federal, provincial, or municipal laws
- Storing, transmitting, or processing data that is illegal to possess or distribute
- Using the System to facilitate fraud, harassment, or discrimination

### 4.5 Reverse Engineering and Intellectual Property Violations

- Attempting to reverse engineer, decompile, disassemble, or otherwise derive the source code of the System
- Copying, reproducing, or redistributing any part of the System's software, interface, or design
- Removing or altering any proprietary notices, labels, or marks on the System

### 4.6 Excessive Automated Access

- Scraping, crawling, or harvesting data from the System using automated tools or bots
- Making API requests at a rate or volume that exceeds normal usage patterns or degrades system performance for other users
- Automating interactions with the System without prior written authorization from the Provider

### 4.7 Out-of-Scope Data Storage

- Using the System as general-purpose file storage unrelated to training management
- Storing data that is outside the agreed scope of the service (e.g., personal files, data unrelated to course delivery and management)
- Uploading content that is not relevant to the System's intended functions

### 4.8 Privacy Law Violations

- Using the System in a manner that violates PIPEDA or any other applicable privacy legislation
- Collecting, using, or disclosing personal information through the System without appropriate consent or lawful authority
- Exporting personal information from the System in a manner that contravenes privacy obligations

---

## 5. Account Security

### 5.1 User Responsibilities

Users are responsible for:

- Maintaining the confidentiality of their login credentials
- Using a strong, unique password for their System account
- Logging out of the System when using shared or public devices
- Immediately reporting any suspected compromise of their account to their organization administrator and to the Provider

### 5.2 Provider Responsibilities

The Provider implements technical safeguards including:

- Bcrypt password hashing
- Session token management with token blacklisting
- Role-based access controls enforcing organization-level data isolation
- HTTPS encryption for all data in transit

---

## 6. Data Accuracy

Customer organizations are responsible for the accuracy, completeness, and currency of the data they and their authorized users input into the System. This includes student records, course information, instructor details, and billing data. The Provider does not independently verify customer-entered data and is not liable for decisions made based on inaccurate data input by users.

---

## 7. Monitoring

The Provider monitors system logs, audit trails, and application metrics for the purpose of maintaining security, ensuring system performance, and detecting violations of this AUP. Monitoring includes but is not limited to:

- Server access logs and request patterns
- Application audit logs (the `audit_log` table records user actions)
- Error tracking via Sentry
- Uptime and performance monitoring via UptimeRobot
- Resource usage and traffic analysis

Users acknowledge that their activity within the System may be logged and reviewed. Monitoring is conducted in accordance with PIPEDA and applicable privacy laws.

---

## 8. Enforcement

Violations of this AUP may result in one or more of the following actions, at the Provider's discretion:

1. **Warning**: Written notice to the user and/or the customer organization's administrator identifying the violation and requiring corrective action.
2. **Account suspension**: Temporary suspension of the violating user's account, or of the customer organization's access, pending investigation and resolution.
3. **Account termination**: Permanent termination of the user's account or the customer organization's service agreement, in accordance with the termination provisions of the MSA.
4. **Legal action**: Where appropriate, the Provider may pursue legal remedies for damages resulting from violations.

The Provider will make reasonable efforts to notify the customer organization before taking enforcement action, except where immediate action is necessary to protect the System, its data, or other users.

---

## 9. Reporting Violations

Users who become aware of a violation of this AUP, or who suspect that a violation has occurred, should report it promptly to:

- **Email**: kpbcma@gmail.com
- **Subject line**: AUP Violation Report -- CPR Training Management System

Reports should include a description of the suspected violation, the date and time it was observed, and any relevant details such as usernames or affected data.

---

## 10. Governing Law

This Acceptable Use Policy is governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein. Any disputes arising under this policy shall be subject to the exclusive jurisdiction of the courts of the Province of Ontario.

---

## 11. Changes to This Policy

The Provider reserves the right to update this AUP at any time. Customer organizations will be given 30 days' written notice of material changes, consistent with the modification provisions of the MSA. Continued use of the System after the effective date of changes constitutes acceptance of the updated policy.

---

*End of document.*
