import { apiService } from './_stub/api/setup';
import mongoose from 'mongoose';

export default async function globalTeardown(): Promise<void> {
  console.log('🧹 Global teardown: cleaning up resources');
  
  try {
    await apiService.stop();
    
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      console.log('Closing mongoose connection in teardown');
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
    
    console.log('✅ Global teardown complete');
  } catch (error) {
    console.error('❌ Error in global teardown:', error);
    
    try {
      await apiService.stop();
    } catch (e) { 
      console.error('Failed to stop API service:', e);
    }
    
    try {
      if (mongoose.connection && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
    } catch (e) {
      console.error('Failed to close database connection:', e);
    }
  }
} 
