# Airtable Image Minimizer Script

This is an Airtable Scripting App that provides a user-friendly interface to interact with your Image Minimizer backend.

## Features

- **Process Images**: Resize and optimize images from selected records or entire views
- **Bulk Download**: Create ZIP files of processed images for multiple records
- **View Services**: See all configured image processing services

## Installation

1. Open your Airtable base
2. Click **Extensions** in the top right corner
3. Click **Add an extension** → **Scripting**
4. Name it "Image Minimizer"
5. Copy the entire contents of `script.js` into the editor
6. Update the `CONFIG` section at the top:
   ```javascript
   const CONFIG = {
       API_URL: 'https://your-app.railway.app',  // Your Railway backend URL
       API_TOKEN: 'your_jwt_token_here',         // Your JWT token from login
   };
   ```
7. Click **Run**

## Getting Your API Token

1. Use a tool like Postman or curl to log in to your backend:
   ```bash
   curl -X POST https://your-app.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"changeme"}'
   ```
2. Copy the `token` from the response
3. Paste it into the `API_TOKEN` field in the script

## Usage

### Processing Images

1. Run the script
2. Click **Process Images**
3. Select a service
4. Choose to process:
   - **Selected Records**: Pick specific records
   - **All Records in View**: Process all records from a view
5. The script will queue the processing jobs
6. Processed URLs will appear in your configured output field

### Bulk Download

1. Run the script
2. Click **Bulk Download**
3. Select a service (or "All Services" for all processed images)
4. Select a table and view
5. The script will create a ZIP file and provide a download link when ready

### Viewing Services

1. Run the script
2. Click **View Services**
3. See all your configured services with their settings

## Notes

- Processing happens asynchronously in the background
- The script uses your backend's rate limiting to respect Airtable's API limits
- Original images are kept for 5 days before automatic deletion
- Public URLs expire based on your service configuration
