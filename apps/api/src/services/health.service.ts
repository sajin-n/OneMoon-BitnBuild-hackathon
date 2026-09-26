export class HealthService {
  public getHealth() {
    return {
      status: 'ok' as const,
      service: 'onemoon-api' as const,
    };
  }
}

export const healthService = new HealthService();
