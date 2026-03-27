import axios, { AxiosInstance } from 'axios';
import { Article, PublishResult, Account } from '../types/index.js';
import { BasePublisher } from './base.js';
import { getCredentials } from '../core/account.js';

export class JuejinPublisher extends BasePublisher {
  readonly platformId = 'juejin';
  readonly name = '掘金';
  
  private client: AxiosInstance;
  
  constructor() {
    super();
    this.client = axios.create({
      baseURL: 'https://api.juejin.cn',
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
      
      const response = await this.client.post('/content_api/v1/article_draft/create', {
        title: article.title,
        mark_content: article.content,
        category_id: '0',
        tag_ids: [],
        brief_content: article.summary || article.content.slice(0, 100),
        cover_image: article.coverImage || ''
      });
      
      if (response.data.err_no === 0) {
        const draftId = response.data.data.id;
        
        const publishResponse = await this.client.post('/content_api/v1/article/publish', {
          draft_id: draftId,
          sync_to_org: false
        });
        
        if (publishResponse.data.err_no === 0) {
          const articleId = publishResponse.data.data.article_id;
          return {
            success: true,
            platformId: this.platformId,
            url: `https://juejin.cn/post/${articleId}`,
            articleId
          };
        }
        
        return {
          success: false,
          platformId: this.platformId,
          error: publishResponse.data.err_msg || '发布失败'
        };
      }
      
      return {
        success: false,
        platformId: this.platformId,
        error: response.data.err_msg || '创建草稿失败'
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
      
      const response = await this.client.post('/content_api/v1/article/update', {
        article_id: articleId,
        title: article.title,
        mark_content: article.content,
        brief_content: article.summary || article.content.slice(0, 100)
      });
      
      if (response.data.err_no === 0) {
        return {
          success: true,
          platformId: this.platformId,
          url: `https://juejin.cn/post/${articleId}`,
          articleId
        };
      }
      
      return {
        success: false,
        platformId: this.platformId,
        error: response.data.err_msg || '更新失败'
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
      
      const response = await this.client.post('/content_api/v1/article/delete', {
        article_id: articleId
      });
      
      return response.data.err_no === 0;
    } catch {
      return false;
    }
  }
  
  async getStats(articleId: string, account: Account): Promise<{ views: number; likes: number; comments: number }> {
    try {
      const credentials = getCredentials(account);
      this.client.defaults.headers.common['Cookie'] = credentials.cookie;
      
      const response = await this.client.post('/content_api/v1/article/detail', {
        article_id: articleId
      });
      
      if (response.data.err_no === 0) {
        const data = response.data.data.article;
        return {
          views: data.view_count || 0,
          likes: data.digg_count || 0,
          comments: data.comment_count || 0
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
      
      const response = await this.client.get('/user_api/v1/user/info');
      return response.data.err_no === 0;
    } catch {
      return false;
    }
  }
}
