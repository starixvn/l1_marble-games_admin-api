import { ApiService } from './_stub/api/setup';

declare global {
  var __API_SERVICE__: ApiService;
  var __CREDENTIALS__: Array<{ password: string; operatorId: string }>;
} 
