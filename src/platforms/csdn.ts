import axios, { AxiosInstance } from 'axios';
import { Article, PublishResult, Account } from '../types/index.js';
import { BasePublisher } from './base.js';
import { getCredentials } from '../core/account.js';

export class CSDNPublisher extends BasePublisher {
  readonly platformId = 'csdn';
  readonly name = 'CSDN';
  
  private client: AxiosInstance;
  
  constructor() {
    super();
    this.client = axios.create({
      baseURL: 'https://bizapi.csdn.net',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Ca-Key': '203803574',
        'X-Ca-Nonce': Date.now().toString(),
        'X-Ca-Signature': '',
        'X-Ca-Signature-Headers': 'x-ca-key,x-ca-nonce'
      }
    });
  }
  
  async publish(article: Article, account: Account): Promise<PublishResult> {
    try {
      const credentials = getCredentials(account);
      
      this.client.defaults.headers.common['Cookie'] = credentials.cookie;
      this.client.defaults.headers.common['X-Ca-Nonce'] = Date.now().toString();
      
      const response = await this.client.post('/blog-console-api/v3/mdeditor/saveArticle', {
        title: article.title,
        markdowncontent: article.content,
        content: this.markdownToHtml(article.content),
        tags: article.tags.join(','),
        categories: article.category || '',
        type: 'original',
        articleedittype: 10,
        pubStatus: 1
      });
      
      if (response.data.code === 200) {
        const articleId = response.data.data.articleId;
        return {
          success: true,
          platformId: this.platformId,
          url: `https://blog.csdn.net/${credentials.username}/article/details/${articleId}`,
          articleId: String(articleId)
        };
      }
      
      return {
        success: false,
        platformId: this.platformId,
        error: response.data.message || '发布失败'
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
      
      const response = await this.client.post('/blog-console-api/v3/mdeditor/updateArticle', {
        id: articleId,
        title: article.title,
        markdowncontent: article.content,
        content: this.markdownToHtml(article.content),
        tags: article.tags.join(','),
        categories: article.category || ''
      });
      
      if (response.data.code === 200) {
        return {
          success: true,
          platformId: this.platformId,
          url: `https://blog.csdn.net/${credentials.username}/article/details/${articleId}`,
          articleId
        };
      }
      
      return {
        success: false,
        platformId: this.platformId,
        error: response.data.message || '更新失败'
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
      
      const response = await this.client.post('/blog-console-api/v3/mdeditor/deleteArticle', {
        articleId
      });
      
      return response.data.code === 200;
    } catch {
      return false;
    }
  }
  
  async getStats(articleId: string, account: Account): Promise<{ views: number; likes: number; comments: number }> {
    try {
      const credentials = getCredentials(account);
      this.client.defaults.headers.common['Cookie'] = credentials.cookie;
      
      const response = await this.client.get(`/blog-console-api/v3/mdeditor/getArticle?id=${articleId}`);
      
      if (response.data.code === 200) {
        const data = response.data.data;
        return {
          views: data.viewCount || 0,
          likes: data.diggCount || 0,
          comments: data.commentCount || 0
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
      
      const response = await this.client.get('/user-api/v1/user/info');
      return response.data.code === 200;
    } catch {
      return false;
    }
  }
  
  private markdownToHtml(markdown: string): string {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
      .replace(/\*(.*)\*/gim, '<i>$1</i>')
      .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" />')
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n/gim, '<br>');
  }
}
