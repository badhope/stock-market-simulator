import { Article, PublishResult, Account } from '../types/index.js';

export interface PlatformPublisher {
  readonly platformId: string;
  readonly name: string;
  
  publish(article: Article, account: Account): Promise<PublishResult>;
  update(articleId: string, article: Article, account: Account): Promise<PublishResult>;
  delete(articleId: string, account: Account): Promise<boolean>;
  getStats(articleId: string, account: Account): Promise<{ views: number; likes: number; comments: number }>;
  validateCredentials(credentials: Record<string, string>): Promise<boolean>;
}

export abstract class BasePublisher implements PlatformPublisher {
  abstract readonly platformId: string;
  abstract readonly name: string;
  
  abstract publish(article: Article, account: Account): Promise<PublishResult>;
  abstract update(articleId: string, article: Article, account: Account): Promise<PublishResult>;
  abstract delete(articleId: string, account: Account): Promise<boolean>;
  abstract getStats(articleId: string, account: Account): Promise<{ views: number; likes: number; comments: number }>;
  abstract validateCredentials(credentials: Record<string, string>): Promise<boolean>;
  
  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }
  
  protected handleError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
