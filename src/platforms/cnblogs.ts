import axios, { AxiosInstance } from 'axios';
import { Article, PublishResult, Account } from '../types/index.js';
import { BasePublisher } from './base.js';
import { getCredentials } from '../core/account.js';

export class CnblogsPublisher extends BasePublisher {
  readonly platformId = 'cnblogs';
  readonly name = '博客园';
  
  private client: AxiosInstance;
  
  constructor() {
    super();
    this.client = axios.create({
      baseURL: 'https://i.cnblogs.com/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  async publish(article: Article, account: Account): Promise<PublishResult> {
    try {
      const credentials = getCredentials(account);
      
      this.client.defaults.headers.common['Cookie'] = credentials.cookie;
      this.client.defaults.headers.common['x-xsrf-token'] = credentials.xsrfToken || '';
      
      const response = await this.client.post('/posts', {
        title: article.title,
        postBody: article.content,
        categories: article.tags.join(', '),
        isMarkdown: true,
        isPublished: true,
        displayOnHomePage: true,
        isAllowComments: true,
        isPinned: false
      });
      
      if (response.status === 200 || response.status === 201) {
        const postId = response.data.postId || response.data.id;
        return {
          success: true,
          platformId: this.platformId,
          url: `https://www.cnblogs.com/${credentials.blogName}/p/${postId}.html`,
          articleId: String(postId)
        };
      }
      
      return {
        success: false,
        platformId: this.platformId,
        error: '发布失败'
      };
    } catch (error) {
      return {
        success: false,
        platformId: this.platformId,
        error: this.handleError(error)
      };
    }
  }
  
  async update(articleId: string, article: Article, account: Account): Promise<PublishResult> {
    try {
      const credentials = getCredentials(account);
      this.client.defaults.headers.common['Cookie'] = credentials.cookie;
      
      const response = await this.client.put(`/posts/${articleId}`, {
        title: article.title,
        postBody: article.content,
        categories: article.tags.join(', ')
      });
      
      if (response.status === 200) {
        return {
          success: true,
          platformId: this.platformId,
          url: `https://www.cnblogs.com/${credentials.blogName}/p/${articleId}.html`,
          articleId
        };
      }
      
      return {
        success: false,
        platformId: this.platformId,
        error: '更新失败'
      };
    } catch (error) {
      return {
        success: false,
        platformId: this.platformId,
        error: this.handleError(error)
      };
    }
  }
  
  async delete(articleId: string, account: Account): Promise<boolean> {
    try {
      const credentials = getCredentials(account);
      this.client.defaults.headers.common['Cookie'] = credentials.cookie;
      
      const response = await this.client.delete(`/posts/${articleId}`);
      return response.status === 200;
    } catch {
      return false;
    }
  }
  
  async getStats(articleId: string, account: Account): Promise<{ views: number; likes: number; comments: number }> {
    try {
      const credentials = getCredentials(account);
      this.client.defaults.headers.common['Cookie'] = credentials.cookie;
      
      const response = await this.client.get(`/posts/${articleId}/stats`);
      
      if (response.status === 200) {
        return {
          views: response.data.viewCount || 0,
          likes: response.data.likeCount || 0,
          comments: response.data.commentCount || 0
        };
      }
      
      return { views: 0, likes: 0, comments: 0 };
    } catch {
      return { views: 0, likes: 0, comments: 0 };
    }
  }
  
  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      this.client.defaults.headers.common['Cookie'] = credentials.cookie;
      
      const response = await this.client.get('/user/info');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
