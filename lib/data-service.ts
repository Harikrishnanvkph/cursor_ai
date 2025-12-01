// Frontend data service with caching and offline support
import { authApi } from './auth-client';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class DataService {
  private baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // =============================================
  // REQUEST WRAPPER WITH CACHING
  // =============================================
  
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    useCache = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = `${options.method || 'GET'}:${url}`;
    
    // Check cache first
    if (useCache && options.method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return { data: cached.data };
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        console.error(`❌ API request failed: ${endpoint}`, {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          errorData
        });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Cache successful GET requests
      if (useCache && options.method === 'GET') {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: this.CACHE_TTL
        });
      }

      return { data };
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error';
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = `Cannot connect to server at ${this.baseUrl}. Please ensure the backend server is running.`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return { 
        error: errorMessage,
        message: 'Request failed'
      };
    }
  }

  // =============================================
  // CONVERSATION MANAGEMENT
  // =============================================
  
  async createConversation(title: string, description?: string): Promise<ApiResponse<any>> {
    return this.request('/api/data/conversations', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }, false);
  }

  async getConversations(limit = 50): Promise<ApiResponse<any[]>> {
    return this.request(`/api/data/conversations?limit=${limit}`);
  }

  async getConversation(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/data/conversations/${id}`);
  }

  async updateConversation(id: string, updates: { title?: string; description?: string }): Promise<ApiResponse<any>> {
    return this.request(`/api/data/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }, false);
  }

  async deleteConversation(id: string): Promise<ApiResponse<void>> {
    return this.request(`/api/data/conversations/${id}`, {
      method: 'DELETE',
    }, false);
  }

  async deleteAllConversations(): Promise<ApiResponse<void>> {
    return this.request('/api/data/conversations', {
      method: 'DELETE',
    }, false);
  }

  // =============================================
  // CHART SNAPSHOT MANAGEMENT
  // =============================================
  
  async saveChartSnapshot(
    conversationId: string, 
    chartType: string, 
    chartData: any, 
    chartConfig: any,
    templateStructure?: any,  // Optional: full template layout structure
    templateContent?: any,     // Optional: text content for template areas
    snapshotId?: string        // Optional: snapshot ID for updates
  ): Promise<ApiResponse<{ id: string }>> {
    const method = snapshotId ? 'PUT' : 'POST';
    const url = snapshotId ? `/api/data/chart-snapshots/${snapshotId}` : '/api/data/chart-snapshots';
    
    return this.request(url, {
      method,
      body: JSON.stringify({
        conversationId,
        chartType,
        chartData,
        chartConfig,
        templateStructure: templateStructure || null,
        templateContent: templateContent || null,
        snapshotId: snapshotId || null
      }),
    }, false);
  }

  async getCurrentChartSnapshot(conversationId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/data/conversations/${conversationId}/current-snapshot`);
  }

  async getChartHistory(conversationId: string, limit = 10): Promise<ApiResponse<any[]>> {
    return this.request(`/api/data/conversations/${conversationId}/chart-history?limit=${limit}`);
  }

  // =============================================
  // CHAT MESSAGE MANAGEMENT
  // =============================================
  
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    chartSnapshotId?: string,
    action?: string,
    changes?: string[]
  ): Promise<ApiResponse<any>> {
    return this.request('/api/data/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        role,
        content,
        chartSnapshotId,
        action,
        changes
      }),
    }, false);
  }

  async getMessages(conversationId: string, limit = 100): Promise<ApiResponse<any[]>> {
    return this.request(`/api/data/conversations/${conversationId}/messages?limit=${limit}`);
  }

  // =============================================
  // USER PREFERENCES
  // =============================================
  
  async getUserPreferences(): Promise<ApiResponse<any>> {
    return this.request('/api/data/user-preferences');
  }

  async updateUserPreferences(preferences: any): Promise<ApiResponse<any>> {
    return this.request('/api/data/user-preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }, false);
  }

  // =============================================
  // PROJECT MANAGEMENT
  // =============================================
  
  async getProjects(): Promise<ApiResponse<any[]>> {
    return this.request('/api/data/projects');
  }

  async createProject(name: string, description?: string): Promise<ApiResponse<any>> {
    return this.request('/api/data/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }, false);
  }

  // =============================================
  // TEMPLATE MANAGEMENT (Blueprint Templates)
  // =============================================
  
  async getTemplates(includePublic = true): Promise<ApiResponse<any[]>> {
    return this.request(`/api/data/templates?includePublic=${includePublic}`);
  }

  async getTemplate(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/data/templates/${id}`);
  }

  async createTemplate(
    name: string,
    description: string | null,
    templateStructure: any
  ): Promise<ApiResponse<any>> {
    return this.request('/api/data/templates', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        templateStructure
      }),
    }, false);
  }

  async updateTemplate(
    id: string,
    updates: {
      name?: string;
      description?: string;
      templateStructure?: any;
    }
  ): Promise<ApiResponse<any>> {
    return this.request(`/api/data/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }, false);
  }

  async deleteTemplate(id: string): Promise<ApiResponse<void>> {
    try {
      return await this.request(`/api/data/templates/${id}`, {
        method: 'DELETE',
      }, false);
    } catch (error: any) {
      console.error('Error in deleteTemplate:', error);
      return { 
        error: error.message || 'Failed to delete template',
        data: undefined 
      };
    }
  }

  async setTemplateVisibility(id: string, isPublic: boolean): Promise<ApiResponse<any>> {
    return this.request(`/api/data/templates/${id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublic }),
    }, false);
  }

  // =============================================
  // CACHE MANAGEMENT
  // =============================================
  
  clearCache(): void {
    this.cache.clear();
  }

  clearConversationCache(conversationId: string): void {
    for (const [key] of this.cache) {
      if (key.includes(conversationId)) {
        this.cache.delete(key);
      }
    }
  }

  // =============================================
  // OFFLINE SUPPORT
  // =============================================
  
  async getOfflineData(): Promise<any> {
    if (typeof window === 'undefined') return {};
    
    try {
      const userId = localStorage.getItem('user-id') || 'anonymous';
      const conversations = localStorage.getItem(`offline-conversations-${userId}`);
      const chartData = localStorage.getItem(`offline-chart-data-${userId}`);
      
      return {
        conversations: conversations ? JSON.parse(conversations) : [],
        chartData: chartData ? JSON.parse(chartData) : null
      };
    } catch (error) {
      console.error('Error reading offline data:', error);
      return {};
    }
  }

  async saveOfflineData(conversationId: string, data: any): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const userId = localStorage.getItem('user-id') || 'anonymous';
      const offlineData = await this.getOfflineData();
      offlineData.conversations = offlineData.conversations || [];
      
      const existingIndex = offlineData.conversations.findIndex(
        (c: any) => c.id === conversationId
      );
      
      if (existingIndex >= 0) {
        offlineData.conversations[existingIndex] = data;
      } else {
        offlineData.conversations.push(data);
      }
      
      localStorage.setItem(`offline-conversations-${userId}`, JSON.stringify(offlineData.conversations));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }
}

export const dataService = new DataService();

