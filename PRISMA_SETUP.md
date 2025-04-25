# Setting Up Prisma ORM for NotesNinja

This guide will walk you through setting up Prisma ORM for the NotesNinja application.

## 1. Database Setup

1. Make sure you have PostgreSQL installed on your machine or use a cloud provider like:
   - [Railway](https://railway.app/)
   - [Supabase](https://supabase.com/)
   - [Neon](https://neon.tech/)
   - [Vercel Postgres](https://vercel.com/storage/postgres)

2. Create a new database for NotesNinja:
   ```sql
   CREATE DATABASE notesninja;
   ```

3. Update your `.env.local` file with the correct database connection URL:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/notesninja?schema=public"
   ```
   Replace `username` and `password` with your PostgreSQL credentials.

## 2. Prisma Setup

Prisma is already set up in this project. Here's what has been done:

1. Installed Prisma dependencies:
   ```bash
   npm install --save-dev prisma
   npm install @prisma/client
   ```

2. Created a Prisma schema in `prisma/schema.prisma` that defines:
   - User model
   - Note model
   - FlashcardDeck model
   - Flashcard model
   - QuizResult model

3. Set up a database connection in the schema using the `DATABASE_URL` from `.env.local`

## 3. Creating the Database Tables

To create the database tables based on the Prisma schema, run:

```bash
npx prisma migrate dev --name init
```

This will:
1. Generate SQL based on your Prisma schema
2. Apply the SQL to your database
3. Generate the Prisma Client

## 4. Using the Database in the App

The database client is set up in `lib/db.ts` and database operations are defined in `lib/prisma-db.ts`.

The application uses these functions to:
- Create and retrieve notes
- Manage flashcard decks
- Save quiz results
- Migrate data from localStorage

## 5. Troubleshooting

If you encounter any issues:

1. Verify your database connection URL is correct
2. Make sure PostgreSQL is running
3. Check that you have the correct permissions to create tables
4. Run `npx prisma studio` to inspect your database visually
5. Run `npx prisma db pull` to update your schema if you manually modified the database

## 6. PostgreSQL Installation

If you don't have PostgreSQL installed yet:

### Windows
1. Download the installer from [PostgreSQL website](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the prompts
3. Remember your password for the postgres user

### macOS
1. Use Homebrew: `brew install postgresql`
2. Start the service: `brew services start postgresql`

### Linux (Ubuntu/Debian)
1. Install PostgreSQL: `sudo apt update && sudo apt install postgresql postgresql-contrib`
2. Start the service: `sudo service postgresql start` 