import { Article, PublishResult, Account } from '../types/index.js';
import { PlatformPublisher } from './base.js';
import { JuejinPublisher } from './juejin.js';
import { CSDNPublisher } from './csdn.js';
import { CnblogsPublisher } from './cnblogs.js';

class PlatformManager {
  private publishers: Map<string, PlatformPublisher> = new Map();
  
  constructor() {
    this.register(new JuejinPublisher());
    this.register(new CSDNPublisher());
    this.register(new CnblogsPublisher());
  }
  
  register(publisher: PlatformPublisher): void {
    this.publishers.set(publisher.platformId, publisher);
  }
  
  getPublisher(platformId: string): PlatformPublisher | undefined {
    return this.publishers.get(platformId);
  }
  
  getSupportedPlatforms(): string[] {
    return Array.from(this.publishers.keys());
  }
  
  async publishToMultiple(
    article: Article,
    accounts: Account[]
  ): Promise<Map<string, PublishResult>> {
    const results = new Map<string, PublishResult>();
    
    const publishPromises = accounts.map(async (account) => {
      const publisher = this.getPublisher(account.platformId);
      if (!publisher) {
        results.set(account.platformId, {
          success: false,
          platformId: account.platformId,
          error: '不支持的平台'
        });
        return;
      }
      
      const result = await publisher.publish(article, account);
      results.set(account.platformId, result);
    });
    
    await Promise.all(publishPromises);
    return results;
  }
  
  async getStatsFromMultiple(
    article: Article,
    accounts: Account[]
  ): Promise<Map<string, { views: number; likes: number; comments: number }>> {
    const stats = new Map<string, { views: number; likes: number; comments: number }>();
    
    const statsPromises = article.platforms.map(async (platform) => {
      if (!platform.articleId) return;
      
      const publisher = this.getPublisher(platform.platformId);
      if (!publisher) return;
      
      const account = accounts.find(a => a.platformId === platform.platformId);
      if (!account) return;
      
      const platformStats = await publisher.getStats(platform.articleId, account);
      stats.set(platform.platformId, platformStats);
    });
    
    await Promise.all(statsPromises);
    return stats;
  }
}

export const platformManager = new PlatformManager();
