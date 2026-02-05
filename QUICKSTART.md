# 🚀 Quick Start Guide

Get your Airtable Image Minimizer up and running in 10 minutes!

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app/))
- Airtable account with API access
- Your Airtable Base ID and API Key

## Step-by-Step Setup

### 1. Get Your Airtable Credentials (2 minutes)

#### API Key:
1. Visit https://airtable.com/account
2. Click "Generate API key"
3. Copy and save it somewhere safe

#### Base ID:
1. Open your Airtable base
2. Click Help → API documentation
3. Copy the Base ID (starts with `app`)

### 2. Deploy to Railway (5 minutes)

#### Create New Project
1. Go to https://railway.app/new
2. Click "Empty Project"
3. Name it "image-minimizer"

#### Add PostgreSQL
1. Click "+ New"
2. Select "Database" → "PostgreSQL"
3. Done! (Railway handles the rest)

#### Add Redis
1. Click "+ New"
2. Select "Database" → "Redis"
3. Done!

#### Deploy Your App
1. Click "+ New"
2. Select "GitHub Repo" and connect this repository
3. Or click "Empty Service" and deploy via CLI

#### Add Storage Volume
1. Click on your web service
2. Go to Settings → Volumes
3. Click "+ New Volume"
4. Mount path: `/app/backend/storage`
5. Click "Add"

#### Configure Variables
1. Click on your web service
2. Go to "Variables" tab
3. Add these variables:

```
AIRTABLE_API_KEY=your_key_here
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
JWT_SECRET=run_this_command_to_generate_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChooseASecurePassword123!
```

To generate JWT_SECRET, run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Click "Deploy" and wait 5-10 minutes for first build

### 3. Update Public URL (1 minute)

1. Once deployed, copy your Railway app URL
2. Go back to Variables
3. Add: `PUBLIC_URL=https://your-app.railway.app`
4. App will redeploy automatically

### 4. Test Your Deployment (2 minutes)

1. Visit your Railway URL
2. You should see the login page
3. Login with your admin credentials
4. Create your first service!

### 5. Install Airtable Script (Optional)

1. Copy `airtable-script/script.js`
2. Open your Airtable base
3. Add "Scripting" extension
4. Paste the code
5. Update CONFIG with your URL and token
6. Run and start processing!

## Getting Your Login Token

Run this command (replace with your details):

```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YourPassword"}'
```

Copy the token from the response and use it in the Airtable script.

## Your First Image Processing Service

Example configuration:

**Service Name:** Product Thumbnails
**Table Name:** Products
**Attachment Field:** Photos
**Output Field:** Thumbnail URLs
**Width:** 800
**Height:** 600
**Format:** jpeg
**Quality:** 80
**URL Duration:** (leave empty for permanent)

## Need Help?

- Check the main [README.md](./README.md) for detailed documentation
- Review [Railway logs](https://railway.app/) for errors
- Verify your Airtable credentials are correct

## Next Steps

1. Create multiple services for different image sizes
2. Set up the Airtable script for easy processing
3. Try bulk downloads
4. Configure URL expiration for temporary links

---

**That's it!** You now have a fully functional image processing service for Airtable. 🎉
