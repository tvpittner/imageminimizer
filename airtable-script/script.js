/**
 * Airtable Image Minimizer Script
 *
 * This script provides a UI for processing images in your Airtable base.
 * It connects to your Railway-deployed backend to handle image processing,
 * bulk downloads, and public URL generation.
 *
 * Installation:
 * 1. Open your Airtable base
 * 2. Click "Extensions" in the top right
 * 3. Click "Add an extension" > "Scripting"
 * 4. Copy this entire script into the editor
 * 5. Update the CONFIG section below with your details
 * 6. Click "Run"
 */

// ============= CONFIGURATION =============
const CONFIG = {
    // Your Railway backend URL (e.g., https://your-app.railway.app)
    API_URL: 'https://your-app.railway.app',

    // Your API token (get this by logging in to your backend)
    API_TOKEN: 'your_jwt_token_here',
};

// ============= MAIN SCRIPT =============

const { API_URL, API_TOKEN } = CONFIG;

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_TOKEN}`,
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
    }

    return response.json();
}

// Load services from backend
async function loadServices() {
    try {
        const data = await apiCall('/api/services');
        return data.services;
    } catch (error) {
        output.text(`Error loading services: ${error.message}`);
        return [];
    }
}

// Process a single record
async function processRecord(serviceId, recordId) {
    try {
        const result = await apiCall('/api/process/record', 'POST', {
            serviceId,
            recordId,
        });
        return result;
    } catch (error) {
        throw new Error(`Failed to process record: ${error.message}`);
    }
}

// Process multiple records
async function processBatch(serviceId, recordIds) {
    try {
        const result = await apiCall('/api/process/batch', 'POST', {
            serviceId,
            recordIds,
        });
        return result;
    } catch (error) {
        throw new Error(`Failed to process batch: ${error.message}`);
    }
}

// Create bulk download
async function createBulkDownload(serviceId, recordIds) {
    try {
        const result = await apiCall('/api/downloads', 'POST', {
            serviceId,
            recordIds,
        });
        return result;
    } catch (error) {
        throw new Error(`Failed to create bulk download: ${error.message}`);
    }
}

// Check download job status
async function checkDownloadStatus(jobId) {
    try {
        const result = await apiCall(`/api/downloads/${jobId}`);
        return result.job;
    } catch (error) {
        throw new Error(`Failed to check download status: ${error.message}`);
    }
}

// Main UI
output.markdown('# 🖼️ Airtable Image Minimizer');

const action = await input.buttonsAsync('What would you like to do?', [
    { label: '📤 Process Images', value: 'process', variant: 'primary' },
    { label: '📦 Bulk Download', value: 'download' },
    { label: '⚙️ View Services', value: 'services' },
]);

// Load services
output.text('Loading services...');
const services = await loadServices();

if (services.length === 0) {
    output.markdown('## ⚠️ No Services Found\n\nPlease create a service in your backend first.');
} else {
    if (action === 'services') {
        // Display services
        output.markdown('## Available Services\n');
        for (const service of services) {
            const status = service.enabled ? '✅ Enabled' : '❌ Disabled';
            output.markdown(`### ${service.name} ${status}`);
            output.text(`Description: ${service.description || 'N/A'}`);
            output.text(`Table: ${service.tableName}`);
            output.text(`Attachment Field: ${service.attachmentFieldName}`);
            output.text(`Output Field: ${service.outputFieldName || 'N/A'}`);

            const config = service.imageConfig;
            output.text(`Image Config:`);
            output.text(`  - Width: ${config.width || 'auto'}`);
            output.text(`  - Height: ${config.height || 'auto'}`);
            output.text(`  - Format: ${config.format || 'original'}`);
            output.text(`  - Quality: ${config.quality || 80}`);
            output.text('---');
        }
    } else if (action === 'process') {
        // Process images
        const serviceOptions = services
            .filter(s => s.enabled)
            .map(s => ({ label: s.name, value: s.id }));

        if (serviceOptions.length === 0) {
            output.text('No enabled services found.');
        } else {
            const serviceId = await input.buttonsAsync('Select a service:', serviceOptions);
            const selectedService = services.find(s => s.id === serviceId);

            const table = base.getTable(selectedService.tableName);
            const processType = await input.buttonsAsync('Process:', [
                { label: 'Selected Records', value: 'selected' },
                { label: 'All Records in View', value: 'all' },
            ]);

            let records;
            if (processType === 'selected') {
                records = await input.recordAsync('Select a record to process:', table);
                records = [records];
            } else {
                const view = await input.viewAsync('Select a view:', table);
                const queryResult = await view.selectRecordsAsync();
                records = queryResult.records;
                queryResult.unloadData();
            }

            const recordIds = records.map(r => r.id);

            output.text(`Processing ${recordIds.length} record(s)...`);

            try {
                if (recordIds.length === 1) {
                    const result = await processRecord(serviceId, recordIds[0]);
                    output.markdown(`✅ **Job queued successfully!**`);
                    output.text(`Job ID: ${result.jobId}`);
                    output.text(`Attachments: ${result.attachmentCount}`);
                } else {
                    const result = await processBatch(serviceId, recordIds);
                    output.markdown(`✅ **Batch queued successfully!**`);
                    output.text(`Jobs queued: ${result.jobs.length}`);
                }

                output.markdown('\n*Images will be processed in the background. Check the output field in your table for results.*');
            } catch (error) {
                output.markdown(`❌ **Error:** ${error.message}`);
            }
        }
    } else if (action === 'download') {
        // Bulk download
        const serviceOptions = services
            .filter(s => s.enabled)
            .map(s => ({ label: s.name, value: s.id }));
        serviceOptions.unshift({ label: 'All Services', value: null });

        const serviceId = await input.buttonsAsync('Select a service (or all):', serviceOptions);
        const selectedService = serviceId ? services.find(s => s.id === serviceId) : null;

        // If a specific service is selected, use its table. Otherwise, ask for table.
        let table;
        if (selectedService) {
            table = base.getTable(selectedService.tableName);
        } else {
            table = await input.tableAsync('Select a table:');
        }

        const view = await input.viewAsync('Select a view:', table);
        const queryResult = await view.selectRecordsAsync();
        const records = queryResult.records;
        queryResult.unloadData();

        const recordIds = records.map(r => r.id);

        output.text(`Creating bulk download for ${recordIds.length} record(s)...`);

        try {
            const result = await createBulkDownload(serviceId, recordIds);
            output.markdown(`✅ **Download job created!**`);
            output.text(`Job ID: ${result.jobId}`);
            output.text('\nChecking status...');

            // Poll for completion
            let attempts = 0;
            const maxAttempts = 60; // 5 minutes max

            while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

                const job = await checkDownloadStatus(result.jobId);

                if (job.status === 'completed') {
                    output.markdown(`\n✅ **Download ready!**`);
                    output.markdown(`[Click here to download](${job.downloadUrl})`);
                    break;
                } else if (job.status === 'failed') {
                    output.markdown(`\n❌ **Download failed:** ${job.error}`);
                    break;
                } else {
                    output.text(`Status: ${job.status}... (attempt ${attempts + 1}/${maxAttempts})`);
                }

                attempts++;
            }

            if (attempts >= maxAttempts) {
                output.markdown('\n⏱️ Download is taking longer than expected. Please check back later.');
            }
        } catch (error) {
            output.markdown(`❌ **Error:** ${error.message}`);
        }
    }
}
