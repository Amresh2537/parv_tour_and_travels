// Simple Google Sheet service if needed
export class GoogleSheetService {
  constructor() {
    this.initialized = false;
  }

  async init() {
    this.initialized = true;
    return true;
  }

  async testConnection() {
    return { success: true, message: 'Using Apps Script backend' };
  }
}