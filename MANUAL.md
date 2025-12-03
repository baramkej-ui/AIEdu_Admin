# AIEdu Admin Program Manual & Handover Document

## 1. Program Overview

### 1.1. Program Purpose

This program is a **dedicated admin website** for managing and operating the core data of the **'AIEdu AI Learning Platform'**. Its goal is to provide integrated management of students, teachers, and learning content (problems, level tests, etc.) who use the platform.

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
-   **Database Interaction**:
    -   **Read**: When a user tries to log in, the system first verifies their email and password with Firebase Authentication. Upon success, it then **reads** the user's information from the `users` collection to check if their `role` is 'admin'.
-   **Code's Role**:
    -   `src/components/auth-form.tsx`: Handles the actual login logic. It sends the user's credentials to Firebase, reads the user's role from the `users` collection, and decides whether to grant access or show an error.

### 4.2. Dashboard (`src/app/dashboard/page.tsx`)

-   **Functionality**: The main status page seen immediately after login. It visually displays key metrics such as total number of users, admins, teachers, and students.
-   **Database Interaction**:
    -   **Read**: When the page loads, it **reads** all documents from the `users` collection to count the total number of users and categorize them by role ('admin', 'teacher', 'student').
-   **Code's Role**:
    -   The code fetches data in real-time from the `users` collection.
    -   It then processes this data to calculate the counts for each category and displays them in the respective cards on the screen.

### 4.3. Member Management (`src/app/students/page.tsx`)

-   **Functionality**: A page to view users by role ('admin', 'teacher', 'student'), add new users, or edit existing user information.
-   **Database Interaction**:
    -   **Read**: Displays a list of users by **reading** from the `users` collection. The tabs ('Admin', 'Teacher', 'Student') filter the results based on the `role` field in each user document.
    -   **Create**: When adding a new user, it first creates the user in Firebase Authentication. Upon success, it **creates** a new document in the `users` collection with the user's details (name, email, role, and the unique ID from Authentication).
    -   **Update**: When editing a user, it **updates** the corresponding document in the `users` collection with the new information.
    -   **Delete**: (Simulated) Clicking the delete button is set up to **delete** a user's document from the `users` collection and their account from Firebase Authentication. (Note: Actual deletion requires a secure backend function and is currently simulated).
-   **Code's Role**:
    -   `src/app/students/page.tsx`: Manages the overall page layout, tabs, and user interaction logic (add, edit, delete).
    -   `src/components/user-form.tsx`: Provides the form for data entry and handles the submission logic, which triggers the Create or Update operations.

### 4.4. Level Test Management

#### 4.4.1. Level Test Selection Page (`src/app/level-tests/page.tsx`)

-   **Functionality**: A menu page to select the type of level test to manage ('Reading', 'Writing', etc.). It does not directly interact with the database.

#### 4.4.2. Reading/Writing Settings Page (`.../reading/page.tsx`, `.../writing/page.tsx`)

-   **Functionality**: Sets the test duration (in minutes) and manages the list of problems for a specific level test.
-   **Database Interaction**:
    -   **Read**:
        -   **Reads** the specific test document (e.g., 'reading') from the `levelTests` collection to get the current test duration and the list of problem IDs (`problemIds`).
        -   **Reads** all documents from the `problems` collection to display them for selection.
    -   **Update**:
        -   When saving the test duration, it **updates** the `totalTimeMinutes` field in the corresponding `levelTests` document.
        -   When adding a problem to the test, it **updates** the `problemIds` array in the `levelTests` document by adding the new problem's ID.
        -   When removing a problem, it **updates** the `problemIds` array by removing the selected problem's ID.
    -   **Create (Problem)**: Admins can create a new problem directly from this page. This action **creates** a new document in the `problems` collection and simultaneously adds its ID to the `problemIds` array of the current test.
-   **Code's Role**:
    -   The page fetches and displays settings from `levelTests` and a list of problems from `problems`.
    -   It provides UI for updating the test duration and modifying the list of associated problems.
    -   `src/components/problem-form.tsx` is reused here for creating and editing problems.

### 4.5. Learning Management

#### 4.5.1. Learning Management Selection Page (`src/app/problems/page.tsx`)

-   **Functionality**: A menu page to select the type of learning content to manage. It does not directly interact with the database.

#### 4.5.2. Role-Play Scenario Management (`.../role-play/page.tsx`)

-   **Functionality**: A page to create, view, edit, and delete (CRUD) Role-Play scenarios.
-   **Database Interaction**:
    -   **Read**: **Reads** all documents from the `rolePlayScenarios` collection and displays them in a list.
    -   **Create**: When adding a new scenario, it **creates** a new document in the `rolePlayScenarios` collection with the entered 'Place' and 'Situation'.
    -   **Update**: When editing an existing scenario, it **updates** the content of the corresponding document.
    -   **Delete**: When deleting a scenario, it **deletes** the corresponding document from the `rolePlayScenarios` collection.
-   **Code's Role**:
    -   `src/app/problems/role-play/page.tsx`: Manages the display of the scenario list and handles the logic for edit and delete actions.
    -   `src/components/role-play-form.tsx`: Provides the form for creating and editing scenarios, triggering the Create or Update operations upon saving.

---

## 5. Key Component Descriptions (Reusable Parts)

-   **`src/components/app-layout.tsx` (Base Layout)**: Provides the common framework for all pages (left sidebar menu, top header).
-   **`src/components/sidebar-nav.tsx` (Sidebar Menu)**: Dynamically shows different menu items based on the user's role ('admin', 'teacher').
-   **`src/components/protected-page.tsx` (Access Control)**: A security device that checks the 'allowed roles' for each page, blocks access for unauthorized users, and sends them to the login page.
-   **`src/components/problem-form.tsx` (Problem Creation/Editing Form)**: A complex form for creating and editing various types of problems, such as multiple-choice and subjective. It is reused in multiple places like level test management.

We hope this document helps you understand the program and is useful for future maintenance and handover processes. Please feel free to ask any questions.
