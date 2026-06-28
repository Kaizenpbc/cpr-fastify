# CPR Training Management System - User Guide

**Application**: https://cpr.kpbc.ca
**Operated by**: KPBC (Kaizen Professional Business Consulting)
**Last Updated**: 2026-06-28

This guide covers the two portals used most by customers: the **Organization Admin Portal** and the **Instructor Portal**. For questions not addressed here, see the FAQ at the end or contact support.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Organization Admin Portal](#2-organization-admin-portal)
3. [Instructor Portal](#3-instructor-portal)
4. [Account and Security](#4-account-and-security)
5. [Getting Help](#5-getting-help)
6. [Frequently Asked Questions](#6-frequently-asked-questions)

---

## 1. Getting Started

### Logging In

1. Open your browser and navigate to **https://cpr.kpbc.ca**.
2. On the login page, enter your **username** and **password**.
3. Select **Log In**.
4. You will be redirected automatically to your portal based on your assigned role (Organization Admin or Instructor).

If you enter incorrect credentials, an error message will appear below the login form. After 10 consecutive failed attempts, your account will be temporarily locked for 15 minutes as a security measure.

### First-Time Password Setup

Your account is created by a KPBC system administrator, who will provide you with initial login credentials via email. On your first login:

1. Log in with the temporary credentials provided.
2. Navigate to your **Profile** page using the sidebar menu.
3. Locate the **Change Password** section.
4. Enter your current (temporary) password, then enter and confirm a new password.
5. Select **Update Password** to save.

Passwords must meet minimum complexity requirements. Choose a strong password that you do not use on other sites.

### Navigating the Dashboard

After logging in, you will land on your **Dashboard** -- the home page for your portal. Key navigation elements:

- **Sidebar menu** (left side): Lists all available sections of your portal. Select any item to navigate to that view. On mobile devices, the sidebar collapses into a hamburger menu icon at the top left.
- **Header bar** (top): Displays your portal name, a refresh button to reload data, and a logout button.
- **Main content area** (center): Shows the content for whichever section you have selected.

The portal uses a dark mode toggle (see Section 4) and is fully responsive on tablets and mobile phones.

---

## 2. Organization Admin Portal

The Organization Admin portal lets you manage course requests, student rosters, billing, and analytics for your organization.

### 2.1 Dashboard Overview

The Dashboard is your landing page and provides a summary of your organization's activity.

- **Summary statistics**: Cards at the top display key figures such as total courses, total students, and active instructors.
- **Billing summary**: Shows totals for pending invoices, overdue invoices, paid invoices, and overall amounts.
- **Recent activity**: Lists your most recent courses and their statuses (requested, confirmed, scheduled, completed, cancelled).
- **Quick actions**: Links to common tasks such as scheduling a new course or viewing your bills.

Data on the dashboard reflects the current state of your account. Use the **refresh button** in the header bar to reload the latest data.

### 2.2 Managing Courses

Select **My Courses** from the sidebar to view all active and upcoming courses for your organization.

#### Viewing Your Course List

The courses page displays a table with the following columns:

- **Date Requested** -- when the course request was submitted
- **Scheduled Date** -- the confirmed date for the course
- **Course Type** -- the type of training (e.g., Standard First Aid, CPR-C)
- **Location** -- where the course will be held
- **Registered Students** -- how many students are enrolled
- **Status** -- current status (Requested, Confirmed, Scheduled, Completed, Cancelled)
- **Instructor** -- the assigned instructor, if one has been assigned
- **Notes** -- any additional notes

#### Filtering Courses

Use the filter and search controls above the table to narrow results by status, date range, or course type.

#### Requesting a New Course

1. Select **Schedule a Course** from the sidebar.
2. Fill in the course request form:
   - Select the **course type** from the dropdown.
   - Choose your **preferred date(s)**.
   - Enter the **location** where the course will be held.
   - Add any **notes** (e.g., special requirements, expected number of students).
3. Select **Submit Request**.
4. A success message confirms your request was submitted. KPBC will review the request, assign an instructor, and confirm the course. You can track its status on the My Courses page.

### 2.3 Student Roster

You can upload student information for each course using a CSV file.

#### Uploading Students via CSV

1. On the **My Courses** page, find the course you want to add students to.
2. Select the **Upload Students** button for that course.
3. A dialog will appear. Select or drag a CSV file into the upload area.
4. The CSV file must contain the following columns: `first_name`, `last_name`, `email`.
5. The system will parse the file and display a preview of the students to be uploaded.
6. Confirm the upload. The registered student count on the course will update automatically.

#### Viewing the Student Roster

Select the **View Students** button on any course row to see the list of enrolled students, including their names and email addresses.

### 2.4 Billing and Invoices

Select **Bills Payable** from the sidebar to view outstanding invoices.

#### Viewing Invoices

The billing page displays:

- **Summary cards** at the top showing total invoices, pending amount, overdue amount, and paid amount.
- **Invoice table** listing each invoice with: invoice number, date created, due date, amount, status (Pending, Overdue, Paid, Payment Submitted), and associated course details.

#### Invoice Statuses

| Status | Meaning |
|--------|---------|
| **Pending** | Invoice has been issued and is awaiting payment. |
| **Overdue** | The due date has passed without payment. |
| **Payment Submitted** | You have submitted payment; KPBC is processing it. |
| **Paid** | Payment has been received and confirmed. |

#### Downloading Invoice PDFs

To download a PDF copy of any invoice, select the **Download PDF** button on the invoice row. The PDF will download to your device and includes all invoice details suitable for your records.

#### Viewing Paid Invoices

Select **Paid Invoices** from the sidebar for a dedicated view of all invoices that have been fully paid, including summary statistics (total paid, average amount, recent payment activity).

### 2.5 Analytics

Select **Analytics** from the sidebar to view detailed statistics about your organization's training activity.

- **Date range filter**: Use the preset buttons (7 days, 30 days, 90 days, 1 year, All Time) or select a custom date range to filter the data.
- **Course statistics**: Total courses requested, completed, cancelled, and completion rates.
- **Student statistics**: Total students trained, average class size.
- **Year-over-year comparisons**: Stat cards display a percentage change indicator comparing current period figures against the same period last year. A green indicator means an increase; red means a decrease.

### 2.6 Exporting Data

You can export data as CSV files from several pages:

- **My Courses page**: Select the **Export CSV** button to download your course list.
- **Bills Payable page**: Select the **Export CSV** button to download your invoice list.
- **Archive page**: Select the **Export CSV** button to download completed/past course records.

CSV files open in any spreadsheet application (Microsoft Excel, Google Sheets, etc.).

### 2.7 Organization Profile Settings

Select **Profile** from the sidebar to view and manage your organization's information:

- Organization name
- Contact email
- Contact phone number
- Address

Changes to your organization profile are saved when you submit the form.

### 2.8 Pricing

Select **Pricing** from the sidebar to view the current pricing structure for your organization's course types. This page displays the rates that apply to your invoices.

### 2.9 Archive

Select **Archive** from the sidebar to view past courses that have been completed or cancelled. This page uses the same table format as the My Courses page but only shows historical records. You can view student lists for archived courses and export the archive to CSV.

---

## 3. Instructor Portal

The Instructor portal is designed for instructors who teach CPR and first aid courses. It provides tools for managing your schedule, taking attendance, and tracking your hours.

### 3.1 Dashboard

The Dashboard is your home page and shows a summary of your current activity:

- **Today's classes**: A list of any classes you are teaching today, with organization name, location, course type, and student count. Action buttons let you go directly to attendance for a class.
- **Upcoming schedule**: A summary of your next few scheduled classes.
- **Statistics**: Key figures such as total classes taught, upcoming classes, and students trained.

### 3.2 My Classes

Select **My Classes** from the sidebar to see your full schedule.

The combined schedule view displays both your **assigned classes** and your **availability dates**, sorted by date:

- **Class entries** show the date, organization name, location, course type, registered students, and status (Scheduled, Confirmed).
- **Availability entries** indicate dates you have marked yourself as available for scheduling.

You can complete a class directly from this view by selecting the appropriate action button, which moves the class to your completed history.

### 3.3 Taking Attendance

Select **Attendance** from the sidebar to manage student attendance for your classes.

#### Marking Attendance

1. The attendance page lists your classes that are ready for attendance to be taken.
2. Select a class to open the attendance view.
3. You will see a list of all registered students for that class.
4. For each student, mark them as **Present** or **Absent** using the toggle or checkbox.
5. When finished, select **Submit Attendance** to save.

#### Completing a Class

After attendance has been recorded, you can mark the class as **Completed**. This action:

- Finalizes the attendance record.
- Automatically generates certification details for students who attended (certificate number, issue date, expiry date based on the course type's validity period).
- Moves the class to your archive.

Once a class is completed, the attendance record cannot be changed.

### 3.4 Availability

Select **Availability** from the sidebar to manage which dates you are available to teach.

- **Adding availability**: Select dates on the calendar to mark them as available. KPBC course administrators will see your availability when scheduling courses.
- **Removing availability**: Select a date you have previously marked to remove it. If a class has already been assigned to that date, you will not be able to remove it.

Your availability helps KPBC schedule courses efficiently. Keep it up to date so that you receive assignments that fit your schedule.

### 3.5 Timesheet

Select **Timesheet** from the sidebar to view and manage your teaching hours.

- The timesheet page displays a record of hours based on your completed classes.
- Review your hours for accuracy.
- Submit your timesheet for processing when ready.

### 3.6 Archive

Select **Archive** from the sidebar to view all your completed classes. The archive table shows historical records including date, organization, course type, student count, and attendance figures.

### 3.7 Profile Settings

Select **Profile** from the sidebar to view and update your personal information and account settings.

- **Personal information**: Name, email, phone number.
- **Change password**: See Section 4.1 below.
- **Download My Data**: See Section 4.2 below.
- **Security settings**: Account security options including password management.

---

## 4. Account and Security

These features are available to all user roles from the Profile or Settings section of your portal.

### 4.1 Changing Your Password

1. Navigate to your **Profile** page.
2. Locate the **Change Password** or **Security Settings** section.
3. Enter your **current password**.
4. Enter your **new password** and confirm it.
5. Select **Update Password**.

If you have forgotten your password and cannot log in:

1. On the login page, select **Forgot Password**.
2. Enter the email address associated with your account.
3. Check your email for a password reset link (sent from `noreply@kpbc.ca`).
4. Follow the link to set a new password.

Password reset links expire after a limited time. If you do not receive the email, check your spam/junk folder.

### 4.2 Download My Data

Under Canadian privacy law (PIPEDA), you have the right to access the personal data we hold about you.

1. Navigate to your **Profile** page.
2. In the **Security Settings** card, select **Download My Data**.
3. A JSON file named `my-data.json` will download to your device containing all personal information associated with your account.

### 4.3 Dark Mode Toggle

The application supports a dark colour theme:

1. Locate the **theme toggle** in the sidebar menu.
2. Select the toggle to switch between light and dark mode.
3. Your preference is saved and will persist across sessions.

---

## 5. Getting Help

### Contacting Support

If you encounter an issue or have a question that is not answered in this guide:

- **Email**: Contact KPBC support at the email address provided in your onboarding materials.
- **Response time**: Support requests are typically responded to within one business day.

### Reporting an Issue

When reporting a problem, include the following information to help us resolve it quickly:

1. **What you were trying to do** (e.g., "upload a student CSV for course #1234").
2. **What happened** (e.g., "an error message appeared saying 'Upload failed'").
3. **When it happened** (date and approximate time).
4. **Your browser** (e.g., Chrome, Firefox, Safari, Edge) and device (desktop or mobile).
5. **A screenshot** of the error, if possible.

---

## 6. Frequently Asked Questions

**Q: I forgot my password. How do I reset it?**
A: On the login page, select "Forgot Password" and enter your email address. You will receive a reset link at the email associated with your account. Follow the link to create a new password. If you do not receive the email within a few minutes, check your spam folder.

**Q: I uploaded a CSV but the student count did not change. What happened?**
A: Ensure your CSV file contains the required columns: `first_name`, `last_name`, and `email`. The file must be in standard CSV format (comma-separated). If the upload dialog showed an error, correct the file and try again. If the upload appeared successful but counts did not update, use the refresh button in the header bar.

**Q: Can I edit or cancel a course request after submitting it?**
A: Once a course request is submitted, it enters the KPBC scheduling workflow. Contact KPBC support to request changes or cancellations. You cannot directly modify a submitted request from the portal.

**Q: How do I get invoice PDFs for my accounting department?**
A: Go to the **Bills Payable** page, find the invoice, and select the **Download PDF** button on that row. Each invoice downloads as an individual PDF file. You can also export all invoice data as a CSV from the same page.

**Q: What browsers are supported?**
A: The application works on all modern browsers including Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari. We recommend keeping your browser up to date for the best experience. The application is also fully functional on mobile browsers.

**Q: How do I export my organization's data?**
A: CSV export buttons are available on the My Courses, Bills Payable, Paid Invoices, and Archive pages. Additionally, you can use the "Download My Data" feature in your profile settings to download your personal account data as a JSON file. If you are leaving the service, KPBC provides a 30-day data export window during the offboarding process.

---

*This guide reflects the CPR Training Management System as of June 2026. Features and interface details may be updated over time. If you notice any discrepancies between this guide and the application, the application behaviour is authoritative.*
