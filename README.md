# CoolCache

CoolCache is a unified full-stack Next.js e-commerce application. Frontend pages and backend APIs live in one repository and deploy as a single project.

## Stack
- Next.js 16 (App Router)
- React 19
- MongoDB + Mongoose
- Redux Toolkit
- Tailwind CSS
- Nodemailer

## Requirements
- Node.js 22+
- npm 10+
- MongoDB URI

## Environment
Copy .env.example to .env.local and set at least:
- MONGODB_URI
- JWT_SECRET
- EMAIL_USER
- EMAIL_PASSWORD
- ADMIN_EMAILS
- NEXT_PUBLIC_SITE_URL

## Scripts
- npm run dev
- npm run build
- npm run start
- npm run lint

## Structure
- src/app: Pages, layouts, API route handlers
- src/components: Reusable UI components
- src/models: Mongoose schemas
- src/services: Email and backend integrations
- src/lib: Shared helpers and database utilities
- src/store: Redux store
- docs: Deployment and project documentation

## Vercel Deployment
Follow docs/DEPLOYMENT_VERCEL.md.

## Documentation
- docs/PROJECT_STRUCTURE.md
- docs/migration/SETUP_COMPLETE.md
