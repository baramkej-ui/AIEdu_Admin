# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

---

## How to Save to GitHub

This guide explains how to save your project source code to a GitHub repository.

### Prerequisites

*   A GitHub account.
*   [Git](https://git-scm.com/downloads) installed on your local machine.

### Step-by-Step Guide

1.  **Download the Source Code**
    *   In Firebase Studio, click the "Download" button at the top right of the screen to download the entire project source code as a ZIP file.
    *   Unzip the downloaded file to a folder on your local computer.

2.  **Create a New Repository on GitHub**
    *   Go to your [GitHub](https://github.com) account and click on "New" or go directly to [github.com/new](https://github.com/new).
    *   Give your repository a name (e.g., `aiedu-admin-app`).
    *   Choose whether you want the repository to be public or private.
    *   **Important**: Do **not** initialize the repository with a README, .gitignore, or license file, as we have already created these.
    *   Click "Create repository".

3.  **Initialize Git and Push Your Code**
    *   Open a terminal or command prompt and navigate to the project folder where you unzipped the source code.
    *   Run the following commands one by one. Replace `<YOUR_GITHUB_REPOSITORY_URL>` with the URL you see on your new GitHub repository page (it should end with `.git`).

    ```bash
    # Initialize a new Git repository in your project folder
    git init
    
    # Add all files to be tracked by Git
    git add .
    
    # Create your first commit (a snapshot of your code)
    git commit -m "Initial commit of AIEdu admin project"
    
    # Set the main branch name to 'main'
    git branch -M main
    
    # Add the URL of your GitHub repository as the remote destination
    git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
    
    # Push your code from your local machine to GitHub
    git push -u origin main
    ```

4.  **Confirm on GitHub**
    *   Refresh your GitHub repository page. You should now see all your project files there.

That's it! Your code is now safely stored on GitHub, and you can continue to track changes using Git.
