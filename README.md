# DAT Courses Management Dashboard

A comprehensive enterprise-grade management dashboard designed to streamline the administration of employees, courses, technical skills, Japanese language proficiency (JLPT), and learning progress tracking. The system supports three distinct user roles – System Admin, Learner (Employee), and Approver (PM/HOD) – enabling end-to-end management of language learning programs, from master data setup to progress approval and analytical reporting.

The application is built with a modern technology stack featuring **Next.js** for the frontend and **Spring Boot** for the backend, ensuring scalability, maintainability, and high performance. The system supports 250–1000 concurrent users, enforces BCrypt password encryption, JWT authentication, and follows RESTful API design principles.


## Key Functional Areas

#### Role-Based Access Control
- System Admin (PMO + Language Experts): Full CRUD operations on all master data, employee management, course setup, system configuration, audit log monitoring, and report generation (Excel/CSV/PDF).

- Learner (All Employees): Profile setup, study hour planning, progress tracking, course enrollment, attendance registration, JLPT certificate upload, and feedback submission.

- Approver (PMs & HODs): Team-level monitoring, study progress approval/rejection, attendance review, team report exports, and notification reception.

#### Master Data Management
- Employee data import (Active/Inactive) with automated default password generation (BCrypt encrypted)

- Holiday calendar management (yearly + ad-hoc public holidays)

- JLPT levels, target levels, communication levels, and learning methods

- Course master with trainer assignment, session schedules, enrollment limits, and status tracking

- Technical skillset management (based on provided Excel templates)

#### Learning & Progress Tracking
- Office-study and self-study hour planning

- Daily/Weekly/Monthly progress metrics: grammar count, vocabulary count, kanji count, reading time, listening time, total study time

- JLPT exam plan setup (exam dates, registration deadlines, confidence levels)

- Certificate verification workflow (JLPT, NATTest)

#### Dashboards & Analytics
- Employee Dashboard: Current/Target JLPT level, study progress %, attendance %, upcoming courses, notifications

- Approver Dashboard: Team JLPT distribution, attendance %, study progress, employees at risk, certification progress

- Admin Dashboard: Total employees, active learners, course statistics, JLPT statistics, attendance analysis, department comparison

- Reports: Attendance analysis, learning progress, JLPT analysis, risk analysis, skillset analysis – exportable to Excel, CSV, PDF

#### Security & Compliance
- JWT authentication with role-based dashboard redirect

- Password policy: minimum 8 characters, uppercase/lowercase, numeric, special character

- Session timeout (30 minutes), max login attempts (3–5), password expiry (90 days – optional)

- Security: HTTPS, BCrypt, SQL injection prevention, XSS/CSRF protection, file upload validation

- Audit logging: login/logout, CRUD operations, approval/rejection, password changes, role changes, import/export (with User ID, Action, Module, Old/New Values, IP address, Timestamp)

#### Notification
- Email + in-app dashboard notifications for: course enrollment, enrollment approval, missing attendance, target not achieved, password reset, upcoming JLPT exams

- SMTP integration (Microsoft 365 for production, Gmail for development)

## Technology Stack

#### Frontend
- TypeScript
- Next.js - [Doc](https://nextjs.org/docs)
- Tailwind CSS - [Doc](https://tailwindcss.com/docs/installation/using-vite)
- Shadcn/UI - [Doc](https://ui.shadcn.com/docs/installation)

#### Backend
- Spring Boot - [Doc](https://docs.spring.io/spring-boot/index.html)

#### Database
- MySQL - [Doc](https://dev.mysql.com/doc/)


## Prerequisites

Before getting started, ensure the following software is installed on your machine:

- Node.js (v18 or later) - [Download](https://nodejs.org/en/download/current)

- Java (v25) - [Download](https://www.oracle.com/java/technologies/downloads/#jdk25-windows)

- MySQL - [Download](https://dev.mysql.com/downloads/)

- Git - [Download](https://git-scm.com/install/)


## Getting Started

#### 1. Clone the Repository

```bash
git clone https://github.com/itismenyantunnaing/dat-management-dashboard.git
cd dat-management-dashboard
```

#### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```


## Running the Application

#### Start the Frontend Development Server

```bash
cd frontend
npm run dev
```
The application will be available at: http://localhost:3000


## Project Structure

```text
dat-management-dashboard/
├── frontend/          # Next.js frontend application
└── backend/           # Spring Boot backend application
```

## Development Workflow

### 📌 1. Branch Strategy

We use a protected branch model centered around `development`.
* **`master`**: Production-ready code. **Never push or merge directly to this branch.**
* **`development`**: Our default and active collaboration branch. All features land here via approved Pull Requests (PRs).
* **Feature Branches**: Isolated workspaces created from `development` for specific tasks.

### Branch Naming Conventions
Always use lowercase and descriptive names with prefixes matching the task type:
* New features: `feature/your-feature-name`
* Bug fixes: `bugfix/issue-description`
* Refactoring: `refactor/component-name`


### 🛠️ 2. The Core Feature Workflow

Always branch off from the absolute latest code on `development`. Follow this sequence whenever starting a new task:

### Step 1: Sync Your Local Base
```bash
# Switch to development
git checkout development

# Pull the latest changes from the remote repository
git pull origin development
```

### Step 2: Create Your Feature Branch
```bash
# Create and switch to your new branch
git checkout -b feature/analytics-charts
```

### Step 3: Code, Test, and Commit Locally
Write your feature and run your test suites locally to ensure everything works before pushing.

```bash
# Stage your changes
git add .

# Commit using the Conventional Commits format (see Section 3)
git commit -m "<type>(<scope>): <short description>"
```

### Step 4: Push to Remote & Alert Your Tester
```bash
# Push your branch up to GitHub
git push origin feature/analytics-charts
```
Do not open a Pull Request yet. Alert your assigned tester (via Discord/Slack) so they can fetch your branch and add the integration or E2E tests. 

### Step 5: Open a Pull Request

Go to the GitHub website, select your branch, and click "**Compare & Pull Request**" against the `development` branch.



### ✍️ 3. Commit Naming Standards (Conventional Commits)
We use Conventional Commits to keep our repository history clean and readable. Every commit message must follow this structure:

```bash
<type>(<scope>): <short description>
```
### Type
#### `feat`
```bash
# for adding a brand new feature or UI component
feat(routing): add dynamic course dashboard layouts
```

#### `fix`
```bash
# for patching a bug, alignment issue, or crash
fix(sidebar): resolve flexbox alignment rendering mismatch
```

#### `refactor`
```bash
# for optimizing code architecture without adding features/bugs
refactor(auth): simplify redundant token checking logic
```

#### `test`
```bash
# for writing unit, integration, or E2E tests
test(analytics): add integration test for chart renderers
```

#### `docs`
```bash
# for writing or modifying markdown or text guides
docs: add development workflow and git standards
```

#### 🔗 Linking and Closing GitHub Issues via Commits
To keep our project tracking clean, you can link commits directly to GitHub Issues by adding the issue number (prefixed with #) using special keywords like closes, fixes.

```bash
# This will automatically resolve and close Issue #1 when this branch is merged!
git commit -m "fix(auth): correct token expiration calculation (fixes #1)"
```

### 🧪 4. The Testing & PR Lifecycle

```bash
[ Developer ] ──► Creates 'feature/analytics' ──► Codes UI ──► Pushes to GitHub
                                                                     │
                                                                     v
[ Tester ]    ◄── Fetches & Tracks 'feature/analytics' ◄─────────────┘
    │
    ├──► Writes Integration & E2E Tests on this branch
    └──► Pushes Test Code to 'feature/analytics'
                                 │
                                 v
                        [ Opens Pull Request ]
                                 │
                     (GitHub Actions Runs Tests)
                                 │
                                 v
                     [ Clean Merge to development ]
```

- **Automated Testing**: Once a PR is opened, GitHub Actions will automatically spin up a test runner to execute unit and integration tests (npm run test / Spring Boot test profiles).

- **If Tests Fail (❌)**: The merge button will lock automatically.

- **Fixed the Bug**: Fix the bug locally in VS Code, run tests on your machine, commit the fix, and push to the same branch. The PR will automatically re-test the updated code.

- **Peer Review**: At least one teammate must review and approve your code.

- **The Merge**: Once status checks are green and you have 1 approval, the author is authorized to click Squash and Merge to bring the clean feature cleanly into `development` branch.

### 👥 5. Tracking a Teammate's Branch Locally
If you need to review a teammate's code or help them debug, download and track it locally using these commands:

```bash
# 1. Fetch all new remote branches from GitHub without changing local files
git fetch --all

# 2. Check out their branch (Git automatically creates a tracking connection)
git checkout feature/teammate-branch

# 3. Pull future updates if they push more commits later
git pull origin feature/teammate-branch
```

### 🧹 6. Local Workspace Cleanup (Post-Merge)
Once a Pull Request is successfully approved and merged on GitHub, the feature branch becomes dead clutter. Use this sequence to safely wipe it from your machine and sync your system:

```bash
# 1. Switch back to your local development branch
git checkout development

# 2. Update your local base with the newly merged code from GitHub
git pull origin development

# 3. Force delete your local feature branch
# (Standard -d will fail here due to GitHub's squash-merge commit history)
git branch -D feature/your-feature-name

# 4. Go to the Project repo and delete your remote feature branch
git push origin --delete feature/your-feature-name

# 5. Prune "ghost" tracking references of branches already deleted on GitHub
git fetch --prune
```
