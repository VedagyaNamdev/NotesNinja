This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, set up your Supabase project:

1. Follow the instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to create and configure your Supabase project
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database Setup

This project uses [Supabase](https://supabase.com) as its database backend. The necessary tables will be created automatically when you run the setup script, or you can create them manually as described in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Supabase Documentation](https://supabase.com/docs) - learn about Supabase features.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Environment Variables

When deploying, make sure to set these environment variables in your Vercel project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

## Workaround for Windows Build Issues

If you encounter EPERM errors when building on Windows, use our specialized Windows build script:

```bash
npm run build:windows
```

This script automatically sets the proper environment variables and configurations to avoid permission errors when accessing protected system directories like `Application Data`.

Alternatively, you can run:

```bash
set NEXT_IGNORE_WINDOWS_DIRS=true && npm run build
```

If you still encounter issues, try these additional steps:

1. Build in a directory path without spaces or special characters
2. Ensure you have permission to read/write in your project directory
3. Try running your command prompt or terminal as administrator
4. Temporarily disable antivirus scanning for your project directory

These options help avoid file system permission errors commonly encountered on Windows.
