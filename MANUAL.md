# EduQuiz Admin Program Manual & Handover Document

## 1. Program Overview

### 1.1. Program Purpose

This program is a **dedicated admin website** for managing and operating the core data of the **'EduQuiz AI Learning Platform'**. Its goal is to provide integrated management of students, teachers, and learning content (problems, level tests, etc.) who use the platform.

### 1.2. Key Technologies (Simple Explanation)

-   **Web Framework (Next.js & React)**: The technology used to build the website's structure and screens. It handles all the screens users see and interactions like button clicks.
-   **Database (Firebase Firestore)**: A real-time cloud database that stores all user information, problems, settings, etc. It stores data like an Excel sheet but is much faster and more reliable.
-   **User Authentication (Firebase Authentication)**: A technology that allows admins to log in securely and manages access to ensure only authorized users can access the system.
-   **AI Integration (Genkit)**: A tool that enables the use of Google's artificial intelligence models within the program, such as for the 'Generate Problems with AI' feature.

---

## 2. Overall System Architecture

This program consists of three main components:

1.  **Frontend (User Interface)**: The web page part that the admin directly sees and interacts with (the screen you are currently viewing).
2.  **Backend (Database & Authentication)**: The invisible server part that stores all data (Firestore) and manages user login states (Authentication).
3.  **AI Service**: An external AI model that handles intelligent tasks like problem generation.

---

## 3. Database Structure (What is stored where?)

All data is stored in Firebase Firestore and organized into **collections (like folders)** by topic.

| Collection (Folder)   | Data Stored                                                 | Description                                                                 |
| --------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| `users`               | User information (name, email, role, etc.)                  | A list of all users, including admins, teachers, and students.              |
| `problems`            | All problem information (question, options, answer, etc.)   | A question bank to be used for level tests and learning activities.         |
| `levelTests`          | Level test settings (test duration, problem list)           | Contains the configuration information for 'Reading' and 'Writing' tests.   |
| `rolePlayScenarios`   | Role-Play situation information (place, situation description) | A list of scenarios to be used for Role-Play learning.                      |
| `studentProgress`     | Student's problem-solving record                            | Records which problems a student got right and how long it took.            |

---

## 4. Functionality and Code Explanation by Page

### 4.1. Login Page (`src/app/login/page.tsx`)

-   **Functionality**: The first gateway where the admin enters their email and password to access the system. Users without the 'admin' role are blocked from logging in.
-   **Code's Role**:
    -   `src/components/auth-form.tsx`: Handles the actual login logic.
    -   It sends the email/password entered by the user to the Firebase authentication system for verification.
    -   Upon successful login, it further checks if the user's 'role' in the `users` collection is 'admin'.
    -   If the role is 'admin', it redirects to the dashboard; otherwise, it displays an error message and denies access.

### 4.2. Dashboard (`src/app/dashboard/page.tsx`)

-   **Functionality**: The main status page seen immediately after login. It visually displays key metrics such as total number of users, problems, teachers, and students.
-   **Code's Role**:
    -   When the page loads, it fetches data in real-time from the `users` and `problems` collections.
    -   It calculates 'Total Users', 'Total Problems', etc., based on the fetched data.
    -   The calculated numbers are displayed in each card (rectangular info box).
    -   The monthly user activity graph currently displays fixed sample data, but the foundation is in place to connect it to actual data.

### 4.3. Member Management (`src/app/students/page.tsx`)

-   **Functionality**: A page to view users by role ('admin', 'teacher', 'student'), add new users, or edit/delete existing user information.
-   **Code's Role**:
    -   `src/app/students/page.tsx`:
        -   Creates tabs for 'Admin', 'Teacher', and 'Student'. Clicking a tab filters and displays only the users of that role from the `users` collection.
        -   Clicking the 'Add User' button displays the user information input form (`UserForm`).
    -   `src/components/user-form.tsx`:
        -   A form to input the user's name, email, role, and password.
        -   **When saving a new user**:
            1.  Calls an AI Flow (`createFirebaseAuthUser`), a secure backend function, to first create the user in the Firebase authentication system.
            2.  Upon successful creation, it receives the user's unique ID (UID) and saves the rest of the information (name, email, role) to the `users` collection.
        -   **When editing an existing user**: It finds the user's document in the `users` collection and updates the information.

### 4.4. Level Test Management

#### 4.4.1. Level Test Selection Page (`src/app/level-tests/page.tsx`)

-   **Functionality**: A menu page to select the type of level test to manage ('Reading', 'Writing', etc.).
-   **Code's Role**: It serves a simple navigation role, linking each button to the appropriate page. Currently, 'Reading' and 'Writing' buttons are active.

#### 4.4.2. Reading/Writing Settings Page (`.../reading/page.tsx`, `.../writing/page.tsx`)

-   **Functionality**: Sets the test duration (in minutes) for each level test and manages the problems to be included in the test (add/remove).
-   **Code's Role**:
    -   When the page loads, it fetches the settings for the current test (e.g., 'reading') from the `levelTests` collection.
    -   It sets the default value of the 'Test Duration' dropdown menu based on the fetched information.
    -   It fetches all problems from the `problems` collection, then filters and displays only the problems whose `problemIds` are included in the current test settings in the 'Problem List' table.
    -   Clicking the 'Add Problem' button displays the problem creation/editing form (`ProblemForm`) to create a new problem or add an existing one to the list.
    -   Clicking the 'Delete' button removes only the problem ID from the `problemIds` array in the `levelTests` document. (The problem itself is not deleted from the `problems` collection).

### 4.5. Learning Management

#### 4.5.1. Learning Management Selection Page (`src/app/problems/page.tsx`)

-   **Functionality**: A menu page to select the type of learning content to manage ('Role-Play', etc.).
-   **Code's Role**: Clicking the 'Role-Play' button serves a navigation role to go to the relevant management page.

#### 4.5.2. Role-Play Scenario Management (`.../role-play/page.tsx`)

-   **Functionality**: A page to create, view, edit, and delete (CRUD) Role-Play scenarios for students to practice.
-   **Code's Role**:
    -   `src/app/problems/role-play/page.tsx`:
        -   When the page loads, it fetches all data from the `rolePlayScenarios` collection and displays it in a list format.
        -   Clicking the 'Add New Scenario' button displays the scenario input form (`RolePlayForm`).
        -   Each scenario can be managed via the 'Edit' and 'Delete' buttons in the list.
    -   `src/components/role-play-form.tsx`:
        -   A form to input 'Place' and 'Situation' as text.
        -   Clicking the 'Save' button saves the entered data as a new document in the `rolePlayScenarios` collection or updates an existing document.

---

## 5. Key Component Descriptions (Reusable Parts)

-   **`src/components/app-layout.tsx` (Base Layout)**: Provides the common framework for all pages (left sidebar menu, top header).
-   **`src/components/sidebar-nav.tsx` (Sidebar Menu)**: Dynamically shows different menu items based on the user's role ('admin', 'teacher').
-   **`src/components/protected-page.tsx` (Access Control)**: A security device that checks the 'allowed roles' for each page, blocks access for unauthorized users, and sends them to the login page.
-   **`src/components/problem-form.tsx` (Problem Creation/Editing Form)**: A complex form for creating and editing various types of problems, such as multiple-choice and subjective. It is reused in multiple places like level test management.

We hope this document helps you understand the program and is useful for future maintenance and handover processes. Please feel free to ask any questions.
