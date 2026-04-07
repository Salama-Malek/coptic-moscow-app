# Deployment Guide — Hostinger Business Hosting

## Prerequisites
- Hostinger Business hosting plan (supports Node.js Web App)
- Domain configured (e.g., `sm4tech.com`)
- GitHub repo: `https://github.com/Salama-Malek/coptic-moscow-app`

## Step 1: Create MySQL Database

1. In hPanel → **Databases** → **MySQL Databases**
2. Create a new database:
   - Database name: `coptic_moscow`
   - Username: `coptic_user`
   - Password: (generate a strong password)
3. Note the credentials — you'll need them for env vars

## Step 2: Create Node.js Web App

1. In hPanel → **Advanced** → **Node.js**
2. Click **Create Application**:
   - Node.js version: **20.x**
   - Application root: `/server`
   - Application startup file: `dist/index.js`
   - Click **Create**
3. In the application settings:
   - Set **NPM install command**: `npm install && npm run build`

## Step 3: Connect GitHub Repository

1. In the Node.js app settings → **Git**
2. Connect to `https://github.com/Salama-Malek/coptic-moscow-app`
3. Branch: `main`
4. Enable **Auto Deploy** from `main`

## Step 4: Create Subdomain

1. In hPanel → **Domains** → **Subdomains**
2. Create: `coptic-api.sm4tech.com`
3. Point it to the Node.js app's folder
4. In hPanel → **SSL** → enable free SSL for `coptic-api.sm4tech.com`

## Step 5: Place Firebase Service Account

1. SSH into the server (hPanel → **Advanced** → **SSH Access**)
2. Create a directory outside `public_html`:
   ```bash
   mkdir -p ~/private
   ```
3. Upload the Firebase service account JSON:
   ```bash
   # From your local machine:
   scp firebase-service-account.json user@server:~/private/
   ```
4. Verify permissions:
   ```bash
   chmod 600 ~/private/firebase-service-account.json
   ```

## Step 6: Set Environment Variables

In the Node.js app settings → **Environment Variables**, set:

```
PORT=3000
NODE_ENV=production
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=coptic_user
DATABASE_PASSWORD=<your-db-password>
DATABASE_NAME=coptic_moscow
JWT_SECRET=<generate: openssl rand -base64 48>
JWT_EXPIRES_IN=7d
CRON_SECRET=<generate: openssl rand -base64 32>
FIREBASE_SERVICE_ACCOUNT_PATH=/home/<username>/private/firebase-service-account.json
ADMIN_BOOTSTRAP_EMAIL=dawood@sm4tech.com
ADMIN_BOOTSTRAP_PASSWORD=ChangeMeImmediately123!
CORS_ORIGINS=https://coptic-api.sm4tech.com
PUBLIC_BASE_URL=https://coptic-api.sm4tech.com
```

Replace `<username>` with your Hostinger SSH username.

## Step 7: Deploy and Run Migrations

1. Push to `main` — auto-deploy triggers build
2. The server automatically runs migrations and seeds on startup
3. Verify: visit `https://coptic-api.sm4tech.com/api/health`
4. Admin panel: visit `https://coptic-api.sm4tech.com/admin`
5. Log in with the bootstrap credentials and **change the password immediately**

## Step 8: Set Up Cron Jobs

In hPanel → **Advanced** → **Cron Jobs**, add two jobs:

### Send due announcements (every 5 minutes)
```
*/5 * * * * curl -s -X POST https://coptic-api.sm4tech.com/api/cron/send-due -H "X-Cron-Secret: <your-cron-secret>" -H "Content-Type: application/json"
```

### Cleanup stale tokens (daily at 03:00)
```
0 3 * * * curl -s -X POST https://coptic-api.sm4tech.com/api/cron/cleanup-tokens -H "X-Cron-Secret: <your-cron-secret>" -H "Content-Type: application/json"
```

Replace `<your-cron-secret>` with the value from your `CRON_SECRET` env var.

## Step 9: Verify

1. Health check: `curl https://coptic-api.sm4tech.com/api/health`
2. Admin login: `https://coptic-api.sm4tech.com/admin`
3. Public calendar: `curl https://coptic-api.sm4tech.com/api/calendar`
4. Send a test announcement from the admin panel

## Troubleshooting

- **App won't start:** Check Node.js logs in hPanel
- **Database errors:** Verify MySQL credentials and that the database exists
- **FCM not sending:** Check that `firebase-service-account.json` path is correct and the file is readable
- **Admin panel blank:** Ensure the Vite build ran (`/server/admin-web/dist/` should exist)
- **CORS errors:** Verify `CORS_ORIGINS` includes the admin panel URL
