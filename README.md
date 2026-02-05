# 🖼️ Airtable Image Minimizer

A powerful image processing service for Airtable that provides automatic image resizing, bulk downloads, and public URL generation. Built as a miniExtensions.com alternative with full control over your infrastructure.

## Features

- **🔄 Image Processing**: Automatically resize and optimize images from Airtable attachment fields
- **📦 Bulk Downloads**: Create ZIP files containing processed images from multiple records
- **🔗 Public URLs**: Generate public URLs for processed images with configurable expiration
- **⚙️ Configurable Services**: Multiple processing profiles with custom dimensions, formats, and quality settings
- **🗂️ Auto-Cleanup**: Automatic deletion of original images after 5 days and expired processed images
- **📊 Web Dashboard**: Simple web interface for managing processing services
- **📱 Airtable Script**: Easy-to-use script that runs directly in Airtable

## Architecture

```
┌─────────────────┐
│   Airtable      │  ← Script calls backend API
│   (Script App)  │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Railway Backend                    │
│  ├─ Express API (REST endpoints)    │
│  ├─ Bull Queue (Async processing)   │
│  ├─ Sharp (Image processing)        │
│  ├─ PostgreSQL (Metadata storage)   │
│  ├─ Redis (Job queue)               │
│  └─ Railway Volume (File storage)   │
└─────────────────────────────────────┘
```

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Railway)
- **Queue**: Bull + Redis (Railway)
- **Image Processing**: Sharp
- **Deployment**: Docker + Railway
- **Frontend**: Vanilla HTML/CSS/JS

---

## 🚀 Railway Deployment Guide

### Prerequisites

1. [Railway Account](https://railway.app/) (sign up for free)
2. [Airtable Account](https://airtable.com/)
3. Airtable API Key and Base ID

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app/)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"** or **"Empty Project"**

### Step 2: Add Services

You need to add 3 services to your Railway project:

#### A. PostgreSQL Database

1. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically provision the database
3. The `DATABASE_URL` environment variable will be auto-provided

#### B. Redis

1. Click **"+ New"** → **"Database"** → **"Add Redis"**
2. Railway will automatically provision Redis
3. The `REDIS_URL` environment variable will be auto-provided

#### C. Web Service (Your Application)

1. Click **"+ New"** → **"GitHub Repo"** (if deploying from GitHub)
   - Or **"Empty Service"** if deploying manually
2. Connect your repository or upload code
3. Railway will detect the Dockerfile and build automatically

### Step 3: Add Storage Volume

1. Click on your **Web Service**
2. Go to **"Settings"** → **"Volumes"**
3. Click **"+ New Volume"**
4. Set mount path: `/app/backend/storage`
5. Click **"Add"**

### Step 4: Configure Environment Variables

Click on your **Web Service** → **"Variables"** and add:

```bash
# Required Variables
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here
JWT_SECRET=your_secure_random_string_here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password_here

# Optional (Railway auto-provides these)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
PORT=3000
NODE_ENV=production

# Storage Configuration
STORAGE_PATH=/app/backend/storage
ORIGINAL_RETENTION_DAYS=5

# Public URL (update after deployment)
PUBLIC_URL=https://your-app.railway.app
```

#### Getting Your Airtable Credentials:

**API Key:**
1. Go to https://airtable.com/account
2. Click **"Generate API key"**
3. Copy the key

**Base ID:**
1. Open your Airtable base
2. Go to **Help** → **API documentation**
3. The Base ID is shown at the top: `appXXXXXXXXXXXXXX`

**JWT Secret:**
```bash
# Generate a secure random string:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Deploy

1. Railway will automatically deploy when you push to your connected Git repository
2. Or click **"Deploy"** if using manual deployment
3. Wait for the build to complete (first build takes ~5-10 minutes)
4. Once deployed, Railway will provide a public URL

### Step 6: Update PUBLIC_URL

1. Copy your Railway app URL (e.g., `https://your-app-production-xxxx.railway.app`)
2. Go back to **Variables**
3. Update `PUBLIC_URL` with your actual Railway URL
4. The app will automatically redeploy

### Step 7: Verify Deployment

Visit your Railway URL:
- **Dashboard**: `https://your-app.railway.app/`
- **Health Check**: `https://your-app.railway.app/health`
- **API Info**: `https://your-app.railway.app/api`

You should see the login page for the dashboard.

---

## 📖 Usage Guide

### 1. Initial Setup

#### Login to Dashboard

1. Navigate to your Railway URL
2. Login with your admin credentials (from `ADMIN_EMAIL` and `ADMIN_PASSWORD`)
3. You'll see the services dashboard

#### Create Your First Service

1. Click **"+ New Service"**
2. Fill in the configuration:
   - **Service Name**: e.g., "Product Images - Thumbnails"
   - **Description**: Optional description
   - **Table Name**: Your Airtable table name (e.g., "Products")
   - **Attachment Field Name**: The field containing images (e.g., "Photos")
   - **Output Field Name**: (Optional) Field to write public URLs to (e.g., "Processed URLs")
   - **Image Configuration**:
     - Width: 800 (pixels)
     - Height: 600 (pixels)
     - Format: jpeg, png, or webp
     - Quality: 80 (1-100)
   - **Public URL Duration**: Leave empty for permanent, or enter days (e.g., 30)
3. Click **"Save Service"**

### 2. Install Airtable Script

1. Open your Airtable base
2. Click **"Extensions"** (top right)
3. Click **"+ Add an extension"** → **"Scripting"**
4. Copy the code from `airtable-script/script.js`
5. Paste into the Airtable script editor
6. Update the CONFIG section:
   ```javascript
   const CONFIG = {
       API_URL: 'https://your-app.railway.app',
       API_TOKEN: 'your_jwt_token',
   };
   ```

#### Getting Your API Token:

Use curl or Postman to login:
```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'
```

Copy the `token` from the response.

### 3. Process Images

#### From Airtable Script:

1. Click **"Run"** in the script editor
2. Select **"📤 Process Images"**
3. Choose your service
4. Select records or entire view
5. Click to start processing
6. Processed URLs will appear in your output field (if configured)

#### Via API (Advanced):

```bash
# Process single record
curl -X POST https://your-app.railway.app/api/process/record \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "service-uuid",
    "recordId": "recXXXXXXXXXXXXXX"
  }'

# Process multiple records
curl -X POST https://your-app.railway.app/api/process/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "service-uuid",
    "recordIds": ["recXXXXX", "recYYYYY"]
  }'
```

### 4. Bulk Download

#### From Airtable Script:

1. Click **"Run"** in the script editor
2. Select **"📦 Bulk Download"**
3. Choose service (or "All Services")
4. Select table and view
5. Script will create ZIP and provide download link

#### Via API:

```bash
# Create download job
curl -X POST https://your-app.railway.app/api/downloads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "service-uuid",
    "recordIds": ["recXXXXX", "recYYYYY"]
  }'

# Check status
curl https://your-app.railway.app/api/downloads/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Download when ready (no auth needed)
https://your-app.railway.app/api/downloads/file/images_uuid.zip
```

---

## 🔧 API Reference

### Authentication

#### POST `/api/auth/register`
Create first admin user (only works if no users exist)

#### POST `/api/auth/login`
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```
Returns: `{ token: "jwt_token", user: {...} }`

### Services

All service endpoints require `Authorization: Bearer TOKEN` header.

#### GET `/api/services`
List all services

#### POST `/api/services`
Create new service

#### PUT `/api/services/:id`
Update service

#### DELETE `/api/services/:id`
Delete service

#### PATCH `/api/services/:id/toggle`
Enable/disable service

### Processing

#### POST `/api/process/record`
Process single record
```json
{
  "serviceId": "uuid",
  "recordId": "recXXXXX"
}
```

#### POST `/api/process/batch`
Process multiple records
```json
{
  "serviceId": "uuid",
  "recordIds": ["recXXXXX", "recYYYYY"]
}
```

### Images

#### GET `/api/images/:filename`
Serve processed image (public, no auth)

#### GET `/api/images/record/:recordId`
List processed images for record (requires auth)

### Downloads

#### POST `/api/downloads`
Create bulk download job
```json
{
  "serviceId": "uuid",
  "recordIds": ["recXXXXX"]
}
```

#### GET `/api/downloads/:jobId`
Check job status

#### GET `/api/downloads/file/:filename`
Download ZIP file (public, no auth)

---

## 🛠️ Development

### Local Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo>
   cd imageminimizer
   ```

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up local services**
   ```bash
   # Install and start PostgreSQL
   # Install and start Redis
   ```

4. **Configure environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your local settings
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Access dashboard**
   ```
   http://localhost:3000
   ```

### Project Structure

```
imageminimizer/
├── backend/
│   ├── src/
│   │   ├── jobs/           # Bull job processors
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Helper functions
│   │   ├── app.ts          # Express app
│   │   └── index.ts        # Entry point
│   ├── storage/            # File storage
│   ├── Dockerfile          # Backend container
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   └── public/
│       ├── index.html      # Dashboard UI
│       └── app.js          # Dashboard logic
├── airtable-script/
│   ├── script.js           # Airtable script
│   └── README.md
├── Dockerfile              # Root Dockerfile
├── railway.json            # Railway config
└── README.md
```

---

## 🔒 Security Notes

- Change default admin password immediately after first deployment
- Store JWT_SECRET securely (use Railway's secret management)
- Use environment variables, never commit secrets
- Public URLs use UUID filenames for obscurity
- Expired images are automatically cleaned up
- Rate limiting respects Airtable API limits

---

## 🐛 Troubleshooting

### Build Fails on Railway

**Issue**: Docker build fails with Sharp errors

**Solution**: Railway uses Alpine Linux. The Dockerfile already includes `vips` and `vips-dev` packages. If issues persist, check Railway build logs.

### Images Not Processing

**Issue**: Jobs are queued but not processing

**Solutions**:
1. Check Redis is running: Visit `https://your-app.railway.app/health`
2. Check logs in Railway dashboard
3. Verify Airtable API key and Base ID are correct
4. Ensure the table and field names match exactly (case-sensitive)

### "Failed to load services" Error

**Issue**: Dashboard shows this error after login

**Solutions**:
1. Check your JWT token is valid (try logging in again)
2. Verify DATABASE_URL is set correctly in Railway
3. Check that database migrations ran (check logs)

### Files Not Being Served

**Issue**: Public URLs return 404

**Solutions**:
1. Verify Volume is mounted at `/app/backend/storage`
2. Check that PUBLIC_URL environment variable matches your Railway URL
3. Ensure processed images directory has write permissions

### Original Images Not Cleaned Up

**Issue**: Storage fills up with original images

**Solutions**:
1. Check cron job is running (check logs at 2 AM)
2. Manually trigger cleanup: `npm run clean` in Railway console
3. Verify `ORIGINAL_RETENTION_DAYS` is set

---

## 📊 Monitoring

### Railway Dashboard

- **Metrics**: CPU, memory, network usage
- **Logs**: Real-time application logs
- **Deployments**: Build and deployment history

### Health Check Endpoint

```bash
curl https://your-app.railway.app/health
```

Returns:
```json
{
  "status": "ok",
  "timestamp": "2024-02-05T12:00:00.000Z",
  "uptime": 3600
}
```

---

## 💰 Cost Estimates

### Railway Pricing (as of 2024)

- **Hobby Plan**: $5/month
  - Includes: 500 hours of usage
  - $0.000231/GB-hour for additional usage

- **Pro Plan**: $20/month
  - Includes: 500 execution hours
  - Better for production use

### Estimated Monthly Costs

- **Low Usage** (100 images/day): ~$5-10/month
- **Medium Usage** (1000 images/day): ~$20-30/month
- **High Usage** (10000 images/day): ~$50-100/month

Costs depend on:
- Number of images processed
- Image sizes
- Storage volume size
- Processing complexity

---

## 🤝 Contributing

This is a single-user project but feel free to fork and customize for your needs!

---

## 📝 License

MIT License - Feel free to use and modify for your projects.

---

## 🆘 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Railway logs
3. Check Airtable API documentation
4. Review this README carefully

---

## 🎉 Credits

Built as an alternative to miniExtensions.com for self-hosted image processing with Airtable.

**Tech Stack Credits:**
- [Sharp](https://sharp.pixelplumbing.com/) - Image processing
- [Express](https://expressjs.com/) - Web framework
- [Bull](https://optimalbits.github.io/bull/) - Job queue
- [Sequelize](https://sequelize.org/) - ORM
- [Railway](https://railway.app/) - Deployment platform
