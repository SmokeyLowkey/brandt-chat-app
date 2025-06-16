# Vercel Deployment Guide

This guide provides instructions for deploying the Brandt Chat Application to Vercel, including setting up the database and creating a root admin user.

## Prerequisites

1. A Vercel account
2. A PostgreSQL database (you can use Vercel Postgres, Supabase, Neon, or any other PostgreSQL provider)
3. Your project code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Connect Your Repository to Vercel

1. Log in to your Vercel account
2. Click "Add New" > "Project"
3. Import your Git repository
4. Configure your project settings (build settings should be auto-detected)

### 2. Set Up Environment Variables

Add the following environment variables in the Vercel project settings:

#### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Your PostgreSQL connection string | `postgresql://user:password@host:port/database` |
| `NEXTAUTH_URL` | The URL of your deployed application | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | A secret key for NextAuth.js | Generate a random string |
| `JWT_SECRET` | Secret key for JWT tokens | Generate a random string |
| `JWT_ALGORITHM` | Algorithm for JWT signing | `HS512` |

#### Root Admin User Variables

These variables are used by the seed script to create the root admin user:

| Variable | Description | Example |
|----------|-------------|---------|
| `SEED_ROOT_ADMIN_EMAIL` | Email address for the root admin | `admin@yourcompany.com` |
| `SEED_ROOT_ADMIN_NAME` | Name for the root admin | `System Administrator` |
| `SEED_ROOT_ADMIN_PASSWORD` | Password for the root admin | Use a strong password |

#### Optional Tenant Variables

You can customize the default tenant created during deployment:

| Variable | Description | Example |
|----------|-------------|---------|
| `SEED_TENANT_NAME` | Name of the default tenant | `Your Company Name` |
| `SEED_TENANT_SLUG` | Slug for the default tenant | `your-company` |
| `SEED_TENANT_DOMAIN` | Domain for the default tenant | `yourcompany.com` |

### 3. Deploy Your Application

1. Click "Deploy" to start the deployment process
2. Vercel will build and deploy your application
3. The `postinstall` script will automatically:
   - Generate Prisma client
   - Apply database migrations
   - Seed the database with the root admin user and default tenant

### 4. Verify Deployment

1. Once deployment is complete, visit your application URL
2. Log in with the root admin credentials you set in the environment variables
3. You should have access to the admin dashboard

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Verify your `DATABASE_URL` is correct
2. Ensure your database is accessible from Vercel's servers
3. Check if your database provider requires SSL (you may need to add `?sslmode=require` to your connection string)

### Seed Script Failures

If the seed script fails:

1. Check the deployment logs in Vercel
2. Ensure all required environment variables are set correctly
3. You can manually run the seed script from the Vercel CLI:
   ```
   vercel env pull .env.local
   npx prisma db seed
   ```

## Updating the Root Admin

If you need to update the root admin credentials after deployment:

1. Update the environment variables in Vercel
2. Redeploy the application, or
3. Connect to your database and update the user record manually

## Security Considerations

- Use strong, unique passwords for your root admin user
- Regularly rotate your JWT_SECRET and NEXTAUTH_SECRET
- Consider using environment variable groups in Vercel to manage different environments (development, staging, production)