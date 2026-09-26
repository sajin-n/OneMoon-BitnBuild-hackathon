import { HealthResponse } from '@onemoon/types';

export interface ApiHealthResponse extends HealthResponse {
  service: 'onemoon-api';
}
