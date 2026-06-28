# DATA PROCESSING AGREEMENT

**DRAFT -- FOR REVIEW BY LEGAL COUNSEL BEFORE USE**

---

**DATA PROCESSING AGREEMENT**

This Data Processing Agreement ("DPA") is entered into as of the date last signed below (the "Effective Date") and forms part of the Master Service Agreement ("MSA") between:

**Provider (Data Processor):**
Kaizen Performance Business Consulting ("KPBC")
(the "Provider" or "Processor")

**Customer (Data Controller):**
[Organization Name]
[Address]
(the "Customer" or "Controller")

Provider and Customer are each referred to herein as a "Party" and collectively as the "Parties."

---

## 1. PURPOSE

1.1 This DPA sets out the terms and conditions under which the Provider processes Personal Information on behalf of the Customer in connection with the provision of the CPR Training Management System (the "Service") pursuant to the MSA.

1.2 This DPA is intended to ensure compliance with the Personal Information Protection and Electronic Documents Act (PIPEDA), S.C. 2000, c. 5, and applicable provincial privacy legislation.

1.3 In the event of a conflict between this DPA and the MSA, this DPA shall prevail with respect to the processing of Personal Information.

---

## 2. DEFINITIONS

2.1 **"Data Breach"** means a breach of security safeguards involving Personal Information under the Provider's custody or control, including any unauthorized access to, collection, use, disclosure, modification, or destruction of Personal Information, or any loss of Personal Information.

2.2 **"Data Subject"** means an identified or identifiable individual to whom Personal Information relates, including students, instructors, organizational staff, and billing contacts.

2.3 **"Personal Information"** has the meaning given to it under PIPEDA, and means information about an identifiable individual, excluding business contact information used for the purpose of communicating with an individual in relation to their employment, business, or profession.

2.4 **"Processing"** means any operation or set of operations performed on Personal Information, whether or not by automated means, including collection, recording, organization, structuring, storage, adaptation, alteration, retrieval, consultation, use, disclosure by transmission, dissemination, alignment, combination, restriction, erasure, or destruction.

2.5 **"Subprocessor"** means any third party engaged by the Provider to process Personal Information on behalf of the Customer in connection with the Service.

2.6 All other capitalized terms not defined in this DPA shall have the meanings given to them in the MSA.

---

## 3. TYPES OF PERSONAL INFORMATION PROCESSED

3.1 The Provider processes the following categories of Personal Information on behalf of the Customer in connection with the Service:

| Category | Data Elements |
|---|---|
| **Student Information** | Full name, email address, phone number, organizational affiliation |
| **Course Records** | Course enrollments, attendance records, course completion dates, evaluation results |
| **Certification Data** | Certificate numbers, certification issuance dates, certification expiry dates, certification status |
| **Instructor Information** | Full name, email address, phone number, qualifications, teaching assignments, pay rates |
| **Organizational Staff** | Full name, email address, phone number, role/title, login credentials (hashed) |
| **Billing and Payment Records** | Invoice details, payment amounts, payment dates, payment methods, billing contact information |
| **System Usage Data** | Login timestamps, IP addresses, audit log entries, session data |

3.2 The Provider does not intentionally collect or process sensitive personal information (e.g., health information, biometric data, or financial account numbers such as credit card numbers) through the Service.

---

## 4. PROCESSING ACTIVITIES

4.1 The Provider performs the following processing activities with respect to Personal Information:

   (a) **Hosting and Storage:** Hosting Customer Data, including Personal Information, on secure infrastructure in Canada;

   (b) **Backup:** Performing daily automated database backups to protect against data loss;

   (c) **Course Management:** Processing student enrollment, attendance, and course completion records;

   (d) **Certification Tracking:** Generating, storing, and tracking certification records, including expiry dates and renewal reminders;

   (e) **Instructor Management:** Processing instructor assignments, schedules, and related records;

   (f) **Billing and Invoicing:** Generating invoices, tracking payments, and processing billing-related communications;

   (g) **Email Notifications:** Sending transactional and operational email communications on behalf of the Customer, including course confirmations, cancellations, completion notifications, and certification renewal reminders;

   (h) **Reporting and Analytics:** Generating organizational reports and analytics using Customer Data; and

   (i) **System Administration:** User account management, access control, and audit logging.

4.2 The Provider shall process Personal Information only in accordance with the Customer's documented instructions as set out in this DPA and the MSA, unless required to do otherwise by applicable law.

---

## 5. PROVIDER OBLIGATIONS

5.1 **Processing Instructions.** The Provider shall process Personal Information only in accordance with the Customer's documented instructions as set out in this DPA, the MSA, and any subsequent written instructions agreed upon by the Parties. The Provider shall promptly inform the Customer if, in the Provider's opinion, an instruction from the Customer infringes applicable privacy legislation.

5.2 **Safeguards.** The Provider shall implement and maintain appropriate technical and organizational security measures to protect Personal Information against unauthorized access, disclosure, alteration, destruction, or loss, as described in Section 6 of this DPA.

5.3 **Personnel.** The Provider shall ensure that any person authorized to process Personal Information is bound by appropriate confidentiality obligations, whether contractual or statutory.

5.4 **Access Restriction.** The Provider shall restrict access to Personal Information to those personnel who require access to perform the Provider's obligations under the MSA and this DPA.

5.5 **Audit Logging.** The Provider shall maintain audit logs that record access to and modifications of Personal Information within the Service, including user identity, action performed, and timestamp.

5.6 **Breach Notification.** The Provider shall notify the Customer of any Data Breach in accordance with Section 8 of this DPA.

5.7 **Cooperation.** The Provider shall provide reasonable cooperation and assistance to the Customer in:

   (a) Responding to requests from Data Subjects to exercise their rights under applicable privacy legislation;

   (b) Conducting privacy impact assessments where required by applicable law;

   (c) Complying with any investigation or inquiry by the Office of the Privacy Commissioner of Canada or any other competent regulatory authority; and

   (d) Ensuring compliance with the Customer's obligations under applicable privacy legislation.

5.8 **Subprocessors.** The Provider shall comply with the requirements of Section 7 of this DPA before engaging any Subprocessor.

---

## 6. SECURITY MEASURES

6.1 The Provider has implemented and shall maintain the following technical and organizational security measures to protect Personal Information:

**6.1.1 Encryption and Data Protection**

   (a) All data transmitted between the Customer's users and the Service is encrypted using HTTPS with TLS (Transport Layer Security);

   (b) HSTS (HTTP Strict Transport Security) is enabled to prevent protocol downgrade attacks;

   (c) User passwords are hashed using the bcrypt algorithm and are never stored in plaintext.

**6.1.2 Access Control**

   (a) Role-based access control (RBAC) restricts access to data and functionality based on the user's assigned role (system administrator, organization administrator, instructor, accountant, course administrator, HR, vendor, student);

   (b) Multi-tenant data isolation ensures that each customer organization's data is logically separated and inaccessible to users of other organizations;

   (c) JWT (JSON Web Token) authentication with httpOnly cookies for session management;

   (d) Account lockout after ten (10) consecutive failed login attempts;

   (e) Token blacklisting upon password change or logout.

**6.1.3 Application Security**

   (a) Rate limiting on authentication endpoints (20 requests per 15 minutes) and API endpoints to prevent brute force and denial-of-service attacks;

   (b) Input validation using Zod schema validation on all API endpoints to prevent injection attacks;

   (c) Security headers implemented via Helmet, including Content Security Policy (CSP), X-Frame-Options, X-Content-Type-Options, and Referrer-Policy;

   (d) CORS (Cross-Origin Resource Sharing) restrictions configured to permit requests only from authorized origins.

**6.1.4 Monitoring and Logging**

   (a) Audit logging of security-relevant events, including login, logout, password changes, user creation and modification, and data access;

   (b) Error monitoring via Sentry for real-time detection of application errors and potential security incidents;

   (c) Uptime monitoring via UptimeRobot with checks at five (5) minute intervals and alerts on downtime;

   (d) HTTP access logging for request tracking and forensic analysis.

**6.1.5 Backup and Recovery**

   (a) Daily automated database backups (mysqldump) with seven (7) day rotation;

   (b) Backup procedures documented and monitored for successful completion.

**6.1.6 Organizational Measures**

   (a) Access to production systems and databases is restricted to authorized Provider personnel;

   (b) Security vulnerabilities are monitored through regular npm audit reviews and dependency updates;

   (c) A documented incident response procedure is maintained for responding to security incidents and Data Breaches.

---

## 7. SUBPROCESSORS

7.1 **Authorized Subprocessors.** The Customer hereby authorizes the Provider to engage the following Subprocessors as of the Effective Date:

| Subprocessor | Purpose | Location |
|---|---|---|
| **TMD Hosting** | Infrastructure hosting (web server, database, file storage) | Canada |
| **Resend** | Transactional email delivery (course notifications, certification reminders, system emails) | United States |
| **Sentry** | Application error monitoring and performance tracking | United States |
| **UptimeRobot** | Service availability monitoring and downtime alerting | United States |
| **GitHub** | Source code hosting, version control, and CI/CD pipeline | United States |

7.2 **Notice of Changes.** The Provider shall provide the Customer with at least thirty (30) days' prior written notice before engaging a new Subprocessor or replacing an existing Subprocessor, including the Subprocessor's name, the processing activities to be performed, and the location of processing.

7.3 **Objection Right.** If the Customer has a reasonable objection to a new or replacement Subprocessor on privacy or data protection grounds, the Customer shall notify the Provider in writing within fifteen (15) days of receiving the notice under Section 7.2. The Parties shall discuss the objection in good faith and attempt to reach a commercially reasonable resolution. If no resolution can be reached, the Customer may terminate the MSA in accordance with its terms.

7.4 **Subprocessor Obligations.** The Provider shall:

   (a) Enter into a written agreement with each Subprocessor imposing data protection obligations no less protective than those in this DPA;

   (b) Remain fully liable to the Customer for the acts and omissions of its Subprocessors with respect to the processing of Personal Information; and

   (c) Conduct appropriate due diligence on each Subprocessor's security practices before engagement.

---

## 8. DATA BREACH NOTIFICATION

8.1 **Notification Timeline.** In the event of a Data Breach, the Provider shall notify the Customer without unreasonable delay and in any event within seventy-two (72) hours of becoming aware of the Data Breach, consistent with PIPEDA requirements.

8.2 **Content of Notification.** The Provider's notification shall include, to the extent known at the time of notification:

   (a) A description of the nature of the Data Breach, including the categories and approximate number of Data Subjects affected;

   (b) The categories and approximate volume of Personal Information involved;

   (c) The likely consequences of the Data Breach;

   (d) The measures taken or proposed to be taken by the Provider to address the Data Breach, including measures to mitigate its effects; and

   (e) The name and contact details of the Provider's designated contact for further information.

8.3 **Cooperation.** Following a Data Breach, the Provider shall:

   (a) Take immediate steps to contain the breach and mitigate any harm;

   (b) Cooperate with the Customer in investigating the breach, including providing access to relevant logs and records;

   (c) Assist the Customer in complying with its notification obligations to the Office of the Privacy Commissioner of Canada and affected individuals under PIPEDA;

   (d) Provide the Customer with timely updates as additional information becomes available; and

   (e) Conduct a post-incident review and implement appropriate remedial measures.

8.4 **Breach Records.** The Provider shall maintain a record of all Data Breaches for a minimum of twenty-four (24) months, regardless of whether the breach was reportable under PIPEDA, including the facts relating to the breach, its effects, and the remedial actions taken.

---

## 9. DATA SUBJECT RIGHTS

9.1 **Right of Access.** Data Subjects may request access to their Personal Information through the Service. The Provider makes individual data available through the authenticated endpoint `GET /auth/my-data`, which returns the Data Subject's personal information, account details, and associated records in a structured format.

9.2 **Right to Deletion / Anonymization.** Data Subjects may request deletion of their Personal Information, subject to applicable legal retention requirements. The Provider processes deletion requests through the endpoint `DELETE /sysadmin/users/:id/personal-data`, which anonymizes the Data Subject's personally identifiable information while retaining non-identifiable course and financial records as required by law.

9.3 **Customer Responsibility.** The Customer is primarily responsible for responding to Data Subject requests. The Provider shall provide reasonable assistance to the Customer in fulfilling such requests within the timelines required by applicable law.

9.4 **Limitations.** The Provider may retain Personal Information to the extent required by applicable law or regulation, including the retention of course records and financial records as set out in Section 10 of this DPA.

---

## 10. DATA RETENTION

10.1 **Retention Schedule.** The Provider shall retain Personal Information in accordance with the following schedule:

| Data Category | Retention Period | Basis |
|---|---|---|
| Course completion records | 7 years from creation | Business records / regulatory requirements |
| Payment and financial records | 7 years from creation | Canada Revenue Agency requirements |
| Certification records | 7 years from creation | Professional certification standards |
| Student Personal Information (PII) | 2 years after account closure | PIPEDA — purpose limitation |
| Instructor Personal Information (PII) | 2 years after account closure | PIPEDA — purpose limitation |
| Organizational staff Personal Information (PII) | 2 years after account closure | PIPEDA — purpose limitation |
| Audit logs | 2 years from creation | Security and compliance |
| System usage data (IP addresses, session data) | 1 year from creation | Operational necessity |

10.2 **Anonymization.** At the end of the applicable retention period, the Provider shall anonymize Personal Information such that it can no longer be associated with or used to identify any individual. Anonymized records shall be retained for statistical purposes only.

10.3 **Early Deletion.** The Customer may request early deletion of Personal Information that is no longer subject to a legal retention requirement. The Provider shall process such requests within thirty (30) days.

---

## 11. DATA RETURN AND DELETION ON TERMINATION

11.1 **Export Window.** Upon termination or expiration of the MSA for any reason, the Customer shall have a period of thirty (30) days from the effective date of termination (the "Export Window") to request an export of Customer Data, including Personal Information.

11.2 **Export Format.** The Provider shall make Customer Data available for export in CSV format (and PDF format for invoices and certificates) upon the Customer's request during the Export Window. Available exports include:

   (a) Course records and rosters;

   (b) Student records and certification data;

   (c) Instructor records;

   (d) Invoice and payment records; and

   (e) Organizational profile and configuration data.

11.3 **Post-Termination.** After the expiration of the Export Window:

   (a) The Provider shall deactivate all Authorized User accounts associated with the Customer;

   (b) Personal Information shall be retained only in accordance with the retention schedule in Section 10.1; and

   (c) At the end of the applicable retention periods, all remaining Personal Information shall be anonymized in accordance with Section 10.2.

11.4 **Certification.** Upon written request from the Customer following the completion of anonymization, the Provider shall provide written confirmation that Personal Information has been anonymized in accordance with this DPA.

---

## 12. CROSS-BORDER DATA TRANSFERS

12.1 **Primary Data Storage.** Customer Data, including Personal Information, is stored on servers located in Canada, hosted by TMD Hosting.

12.2 **Subprocessor Transfers.** Certain Subprocessors engaged by the Provider are located in or may process Personal Information in the United States, as identified in Section 7.1. These transfers are made in connection with the specific processing activities described in the Subprocessor table and are limited to the minimum Personal Information necessary for the Subprocessor to perform its function.

12.3 **Safeguards for Cross-Border Transfers.** For any transfer of Personal Information outside of Canada, the Provider shall:

   (a) Ensure that the transfer is made in accordance with PIPEDA and applicable provincial privacy legislation;

   (b) Enter into appropriate contractual arrangements with the Subprocessor to ensure a comparable level of protection for Personal Information;

   (c) Assess the data protection laws of the recipient jurisdiction and implement supplementary measures where necessary; and

   (d) Inform the Customer of the specific jurisdictions in which Personal Information may be processed.

12.4 **Customer Acknowledgement.** The Customer acknowledges that certain Subprocessors identified in Section 7.1 are located in the United States and that Personal Information may be subject to the laws of that jurisdiction, including potential access by law enforcement or national security authorities.

---

## 13. AUDIT RIGHTS

13.1 **Compliance Documentation.** Upon the Customer's written request, made no more than once per calendar year, the Provider shall provide the Customer with:

   (a) A summary of the security measures in place to protect Personal Information;

   (b) Confirmation of compliance with this DPA;

   (c) The results of any relevant security assessments, penetration tests, or audits conducted by or on behalf of the Provider (subject to reasonable redaction of information that could compromise security); and

   (d) An updated list of Subprocessors and their processing activities.

13.2 **Additional Audit Rights.** If the Customer has reasonable grounds to believe that the Provider is not in compliance with this DPA, or in the event of a Data Breach, the Customer may, upon reasonable written notice:

   (a) Request additional compliance documentation; or

   (b) Engage a qualified, independent third-party auditor (subject to reasonable confidentiality undertakings) to conduct an assessment of the Provider's compliance with this DPA.

13.3 **Costs.** The Customer shall bear the costs of any audit conducted under Section 13.2, unless the audit reveals a material non-compliance by the Provider, in which case the Provider shall bear the reasonable costs of the audit.

13.4 **Cooperation.** The Provider shall cooperate with any audit conducted under this Section and provide reasonable access to relevant systems, records, and personnel, subject to appropriate confidentiality and security safeguards.

---

## 14. TERM AND TERMINATION

14.1 **Term.** This DPA shall commence on the Effective Date and shall remain in effect for as long as the MSA is in effect (co-terminous with the MSA).

14.2 **Survival.** The Provider's obligations under this DPA with respect to the processing and protection of Personal Information shall survive the termination or expiration of this DPA and the MSA to the extent that the Provider retains any Personal Information in accordance with the retention schedule in Section 10.1.

---

## 15. GOVERNING LAW

15.1 This DPA shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of laws principles.

15.2 Any dispute arising out of or in connection with this DPA shall be resolved in accordance with the dispute resolution provisions of the MSA.

---

## 16. GENERAL PROVISIONS

16.1 **Entire Agreement.** This DPA, together with the MSA, constitutes the entire agreement between the Parties with respect to the processing of Personal Information in connection with the Service.

16.2 **Amendments.** No amendment to this DPA shall be effective unless it is in writing and signed by authorized representatives of both Parties.

16.3 **Severability.** If any provision of this DPA is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.

16.4 **Counterparts.** This DPA may be executed in counterparts, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument. Electronic signatures shall be deemed to be original signatures for all purposes.

---

## SIGNATURES

IN WITNESS WHEREOF, the Parties have executed this Data Processing Agreement as of the Effective Date.

**PROVIDER (DATA PROCESSOR): Kaizen Performance Business Consulting (KPBC)**

| | |
|---|---|
| Signature: | ________________________________ |
| Name: | ________________________________ |
| Title: | ________________________________ |
| Date: | ________________________________ |

**CUSTOMER (DATA CONTROLLER): [Organization Name]**

| | |
|---|---|
| Signature: | ________________________________ |
| Name: | ________________________________ |
| Title: | ________________________________ |
| Date: | ________________________________ |

---

*End of Data Processing Agreement*
