# BrewOps Server (local copy)

This directory contains a standalone copy of the server used by the BrewOps project.

Quick start

1. Install dependencies:

   npm install

2. Create a `.env` from `.env.example` and fill in values (database, mail, JWT secret):

   cp .env.example .env

3. Start server in development:

   npm run dev

Notes

- This is a local split of the server previously living under `server/` in the monorepo. It was created with a fresh git history and intended to be pushed to a new remote repository.
- The server requires a MySQL database. Ensure your `.env` points to the correct DB.
