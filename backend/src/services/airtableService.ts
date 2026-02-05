import Airtable from 'airtable';
import { config } from '../utils/config';
import { airtableRateLimiter } from '../utils/rateLimiter';

export class AirtableService {
  private base: Airtable.Base;

  constructor() {
    Airtable.configure({
      apiKey: config.airtable.apiKey,
    });
    this.base = Airtable.base(config.airtable.baseId);
  }

  async getRecord(tableName: string, recordId: string): Promise<any> {
    return airtableRateLimiter.execute(async () => {
      const record = await this.base(tableName).find(recordId);
      return {
        id: record.id,
        fields: record.fields,
      };
    });
  }

  async getRecords(tableName: string, recordIds?: string[]): Promise<any[]> {
    return airtableRateLimiter.execute(async () => {
      const records: any[] = [];

      if (recordIds && recordIds.length > 0) {
        // Fetch specific records
        for (const recordId of recordIds) {
          try {
            const record = await this.base(tableName).find(recordId);
            records.push({
              id: record.id,
              fields: record.fields,
            });
          } catch (error) {
            console.error(`Error fetching record ${recordId}:`, error);
          }
        }
      } else {
        // Fetch all records
        await this.base(tableName)
          .select()
          .eachPage((pageRecords, fetchNextPage) => {
            pageRecords.forEach(record => {
              records.push({
                id: record.id,
                fields: record.fields,
              });
            });
            fetchNextPage();
          });
      }

      return records;
    });
  }

  async updateRecord(tableName: string, recordId: string, fields: any): Promise<any> {
    return airtableRateLimiter.execute(async () => {
      const record = await this.base(tableName).update(recordId, fields);
      return {
        id: record.id,
        fields: record.fields,
      };
    });
  }

  async getAttachments(tableName: string, recordId: string, fieldName: string): Promise<Array<{
    id: string;
    url: string;
    filename: string;
    size: number;
    type: string;
  }>> {
    const record = await this.getRecord(tableName, recordId);
    const attachments = record.fields[fieldName];

    if (!attachments || !Array.isArray(attachments)) {
      return [];
    }

    return attachments.map((attachment: any) => ({
      id: attachment.id,
      url: attachment.url,
      filename: attachment.filename,
      size: attachment.size,
      type: attachment.type,
    }));
  }

  async writeProcessedUrls(
    tableName: string,
    recordId: string,
    fieldName: string,
    urls: string[]
  ): Promise<void> {
    const urlString = urls.join('\n');
    await this.updateRecord(tableName, recordId, {
      [fieldName]: urlString,
    });
  }
}

export const airtableService = new AirtableService();
