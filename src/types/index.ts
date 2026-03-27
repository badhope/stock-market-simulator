export interface Platform {
  id: string;
  name: string;
  type: 'tech' | 'social' | 'blog' | 'media';
  icon?: string;
  apiUrl?: string;
  webUrl: string;
  features: PlatformFeature[];
}

export interface PlatformFeature {
  name: string;
  supported: boolean;
  description?: string;
}

export interface Account {
  id: string;
  platformId: string;
  username: string;
  nickname?: string;
  avatar?: string;
  credentials: EncryptedData;
  status: 'active' | 'expired' | 'error';
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EncryptedData {
  iv: string;
  data: string;
  tag: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  category?: string;
  coverImage?: string;
  status: 'draft' | 'published' | 'scheduled';
  platforms: ArticlePlatform[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  scheduledAt?: Date;
}

export interface ArticlePlatform {
  platformId: string;
  accountId: string;
  status: 'pending' | 'publishing' | 'published' | 'failed';
  url?: string;
  articleId?: string;
  error?: string;
  stats?: ArticleStats;
  publishedAt?: Date;
}

export interface ArticleStats {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  collectedAt: Date;
}

export interface PublishResult {
  success: boolean;
  platformId: string;
  url?: string;
  articleId?: string;
  error?: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  content: string;
  tags: string[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublishOptions {
  platforms: string[];
  accountId?: string;
  scheduled?: Date;
  template?: string;
}

export interface Config {
  encryptionKey?: string;
  defaultPlatforms: string[];
  editor?: string;
  dataDir: string;
}
