import { describe, it, expect, beforeEach } from 'vitest';
import { Article, Account } from '../types';
import { BasePublisher } from './base';

class MockPublisher extends BasePublisher {
  readonly platformId = 'mock';
  readonly name = 'Mock Platform';
  
  private shouldFail = false;
  
  setFail(fail: boolean): void {
    this.shouldFail = fail;
  }
  
  async publish(article: Article, account: Account): Promise<{ success: boolean; platformId: string; url?: string; articleId?: string; error?: string }> {
    if (this.shouldFail) {
      return {
        success: false,
        platformId: this.platformId,
        error: 'Mock publish error'
      };
    }
    
    return {
      success: true,
      platformId: this.platformId,
      url: `https://mock.com/article/${article.id}`,
      articleId: `mock-${article.id}`
    };
  }
  
  async update(articleId: string, article: Article, account: Account): Promise<{ success: boolean; platformId: string; url?: string; articleId?: string; error?: string }> {
    return {
      success: true,
      platformId: this.platformId,
      url: `https://mock.com/article/${articleId}`,
      articleId
    };
  }
  
  async delete(articleId: string, account: Account): Promise<boolean> {
    return true;
  }
  
  async getStats(articleId: string, account: Account): Promise<{ views: number; likes: number; comments: number }> {
    return {
      views: 100,
      likes: 10,
      comments: 5
    };
  }
  
  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    return !!credentials.cookie;
  }
}

describe('BasePublisher', () => {
  let publisher: MockPublisher;
  let mockArticle: Article;
  let mockAccount: Account;
  
  beforeEach(() => {
    publisher = new MockPublisher();
    
    mockArticle = {
      id: 'test-article-id',
      title: 'Test Article',
      content: '# Test Content\n\nThis is a test article.',
      tags: ['test', 'mock'],
      status: 'draft',
      platforms: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockAccount = {
      id: 'test-account-id',
      platformId: 'mock',
      username: 'testuser',
      credentials: { iv: '', data: '', tag: '' },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });
  
  describe('publish', () => {
    it('should successfully publish an article', async () => {
      const result = await publisher.publish(mockArticle, mockAccount);
      
      expect(result.success).toBe(true);
      expect(result.platformId).toBe('mock');
      expect(result.url).toContain(mockArticle.id);
      expect(result.articleId).toBeDefined();
    });
    
    it('should handle publish failure', async () => {
      publisher.setFail(true);
      
      const result = await publisher.publish(mockArticle, mockAccount);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Mock publish error');
    });
  });
  
  describe('update', () => {
    it('should successfully update an article', async () => {
      const result = await publisher.update('article-123', mockArticle, mockAccount);
      
      expect(result.success).toBe(true);
      expect(result.articleId).toBe('article-123');
    });
  });
  
  describe('delete', () => {
    it('should successfully delete an article', async () => {
      const result = await publisher.delete('article-123', mockAccount);
      
      expect(result).toBe(true);
    });
  });
  
  describe('getStats', () => {
    it('should return article statistics', async () => {
      const stats = await publisher.getStats('article-123', mockAccount);
      
      expect(stats.views).toBe(100);
      expect(stats.likes).toBe(10);
      expect(stats.comments).toBe(5);
    });
  });
  
  describe('validateCredentials', () => {
    it('should validate credentials with cookie', async () => {
      const result = await publisher.validateCredentials({ cookie: 'test-cookie' });
      
      expect(result).toBe(true);
    });
    
    it('should reject credentials without cookie', async () => {
      const result = await publisher.validateCredentials({});
      
      expect(result).toBe(false);
    });
  });
});
