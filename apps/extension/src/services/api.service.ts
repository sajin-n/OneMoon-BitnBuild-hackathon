/**
 * Extension API Service Client (Scaffolding)
 * Handles communication between browser extension and OneMoon Fastify API.
 */

export class ExtensionApiService {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async checkHealth(): Promise<{ status: string; service: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
      return await response.json();
    } catch {
      return { status: 'offline', service: 'onemoon-api' };
    }
  }
}

export const extensionApiService = new ExtensionApiService();
