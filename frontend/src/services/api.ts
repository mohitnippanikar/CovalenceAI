import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';

// Custom type to fix the retry property
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiService {
  private api: AxiosInstance;
  
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors(): void {
    // Request interceptor for adding auth token
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );
    
    // Response interceptor for handling token refresh
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as CustomRequestConfig;
        
        // If unauthorized and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) {
              this.logout();
              return Promise.reject(error);
            }
            
            // Get new tokens
            const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
              refreshToken,
            });
            
            const { token } = response.data;
            
            // Save new token
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
            
            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return this.api(originalRequest);
          } catch (refreshError) {
            this.logout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  private logout(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    window.location.href = '/login';
  }
  
  // Mock implementation for demo purposes
  private createMockResponse<T>(data: T): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(data);
      }, 500);
    });
  }
  
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // For demo mode, intercept certain requests and return mock data
    if (localStorage.getItem('demo_mode') === 'true') {
      const mockData = this.getMockData<T>(url);
      if (mockData) {
        return this.createMockResponse(mockData);
      }
    }
    
    try {
      const response = await this.api.get<T>(url, config);
      return response.data;
    } catch (error) {
      // If in demo mode, return mock data even on error
      if (localStorage.getItem('demo_mode') === 'true') {
        const mockData = this.getMockData<T>(url);
        if (mockData) {
          return this.createMockResponse(mockData);
        }
      }
      throw error;
    }
  }
  
  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // For demo mode, intercept certain requests and return mock data
    if (localStorage.getItem('demo_mode') === 'true') {
      const mockData = this.getMockData<T>(url, data);
      if (mockData) {
        return this.createMockResponse(mockData);
      }
    }
    
    try {
      const response = await this.api.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      // If in demo mode, return mock data even on error
      if (localStorage.getItem('demo_mode') === 'true') {
        const mockData = this.getMockData<T>(url, data);
        if (mockData) {
          return this.createMockResponse(mockData);
        }
      }
      throw error;
    }
  }
  
  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }
  
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }
  
  // Mock data generator based on URL
  private getMockData<T>(url: string, requestData?: any): T | null {
    // This would be expanded with more mock data as needed
    return null;
  }
}

const apiService = new ApiService();
export default apiService; 