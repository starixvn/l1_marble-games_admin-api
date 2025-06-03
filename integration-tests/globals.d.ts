import { ApiService } from './_stub/api/setup';

export interface AdminCredentials {
  username: string;
  password: string;
  access_token?: string;
}

declare global {
  var __API_SERVICE__: ApiService;
  var __CREDENTIALS__: Array<{ password: string; operatorId: string }>;
  var __ADMIN_CREDENTIALS__: AdminCredentials | null;
} 
