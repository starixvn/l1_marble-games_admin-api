import { ChildProcess, spawn } from 'child_process';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

const DEFAULT_MAX_RETRY = 30;
const DEFAULT_RETRY_LOG_RESOLUTION = 5;
const DEFAULT_RETRY_INTERVAL = 500;

export class ApiService {
  private process: ChildProcess | null = null;
  private readonly port: string;
  private readonly baseUrl: string;

  constructor() {
    const envPath = process.cwd() + '/.env.INTEGRATION';
    dotenv.config({ path: envPath });
    this.port = process.env.PORT ?? '5000';
    this.baseUrl = `http://localhost:${this.port}`;
  }

  async start(): Promise<void> {
    if (this.process) {
      console.log('API service is already running');
      return;
    }

    console.log('Starting API service...');
    
    if (!fs.existsSync(process.cwd() + '/dist')) {
      throw new Error('API service is not built. Run "npm run build" first.');
    }

    this.process = spawn('node', ['dist/src/main'], {
      env: {
        ...process.env,
        PORT: this.port,
        NODE_ENV: 'test',
      },
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.process.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      console.log(`API stdout: ${output}`);
    });

    this.process.stderr?.on('data', (data) => {
      console.error(`API stderr: ${data.toString().trim()}`);
    });

    this.process.on('exit', (code) => {
      console.log(`API service exited with code ${code}`);
      this.process = null;
    });

    await this.waitForServerReady();
  }

  async stop(): Promise<void> {
    if (!this.process) {
      console.log('API service is not running');
      return;
    }

    console.log('Stopping API service...');
    
    try {
      
      if (this.process.stdout) {
        this.process.stdout.removeAllListeners();
      }
      if (this.process.stderr) {
        this.process.stderr.removeAllListeners();
      }
      this.process.removeAllListeners();
      
      this.process.kill('SIGTERM');
      
      await new Promise<void>((resolve) => {
        if (!this.process) {
          resolve();
          return;
        }
        
        const forceKillTimeout = setTimeout(() => {
          if (this.process) {
            console.log('Process did not exit gracefully, force killing');
            this.process.kill('SIGKILL');
            this.process = null;
          }
          resolve();
        }, 5000);
        
        this.process.once('exit', () => {
          clearTimeout(forceKillTimeout);
          this.process = null;
          resolve();
        });
      });
      
      console.log('API service stopped');
    } catch (error) {
      console.error('Error stopping API service:', error);
      if (this.process) {
          this.process.kill('SIGKILL');
          this.process = null;
      }
    }
  }

  private async waitForServerReady(maxRetries = DEFAULT_MAX_RETRY, retryInterval = DEFAULT_RETRY_INTERVAL): Promise<void> {
    const totalWaitTime = maxRetries * retryInterval / 1000;
    console.log(`Waiting for API to be ready (max ${totalWaitTime}s)...`);
    
    return new Promise<void>((resolve, reject) => {
      let attempts = 0;
      
      const checkServer = async () => {
        if (!this.process || this.process.killed) {
          return reject(new Error('API service process is not running'));
        }
        
        attempts++;
        
        console.log(`Trying to connect to ${this.baseUrl}...`);
        const rootResponse = await fetch(this.baseUrl).catch(() => null);
        
        if (rootResponse?.ok) {
          return resolve();
        }
        
        console.log(`Trying to connect to ${this.baseUrl}/healthcheck...`);
        const healthResponse = await fetch(`${this.baseUrl}/healthcheck`).catch(() => null);
        
        if (healthResponse?.ok) {
          console.log('API service is ready at health endpoint!');
          return resolve();
        }
        
        if (attempts % DEFAULT_RETRY_LOG_RESOLUTION === 0) {
          console.log(`Still waiting for API to be ready... (${attempts}/${maxRetries})`);
        }
        
        if (attempts >= maxRetries) {
          return reject(new Error(`API service did not start within ${totalWaitTime} seconds`));
        }
        
        setTimeout(checkServer, retryInterval);
      };
      
      checkServer();
    });
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const apiService = new ApiService();
