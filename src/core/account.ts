import fs from 'fs';
import { Account, Platform } from '../types/index.js';
import { generateId, encrypt, decrypt } from '../utils/crypto.js';
import { getDataPath, ensureDataDir } from '../utils/config.js';

const ACCOUNTS_FILE = 'accounts.json';

let accounts: Account[] = [];
let encryptionKey: string = '';

export function initAccountManager(key: string): void {
  encryptionKey = key;
  ensureDataDir();
  loadAccounts();
}

function loadAccounts(): void {
  const filePath = getDataPath(ACCOUNTS_FILE);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    accounts = JSON.parse(content);
  }
}

function saveAccounts(): void {
  const filePath = getDataPath(ACCOUNTS_FILE);
  fs.writeFileSync(filePath, JSON.stringify(accounts, null, 2));
}

export function addAccount(
  platformId: string,
  username: string,
  credentials: Record<string, string>,
  nickname?: string
): Account {
  const encrypted = encrypt(JSON.stringify(credentials), encryptionKey);
  
  const account: Account = {
    id: generateId(),
    platformId,
    username,
    nickname,
    credentials: encrypted,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  accounts.push(account);
  saveAccounts();
  
  return account;
}

export function getAccount(id: string): Account | undefined {
  return accounts.find(a => a.id === id);
}

export function getAccountsByPlatform(platformId: string): Account[] {
  return accounts.filter(a => a.platformId === platformId);
}

export function getAllAccounts(): Account[] {
  return accounts;
}

export function updateAccount(id: string, updates: Partial<Account>): Account | undefined {
  const index = accounts.findIndex(a => a.id === id);
  if (index === -1) return undefined;
  
  accounts[index] = {
    ...accounts[index],
    ...updates,
    updatedAt: new Date()
  };
  
  saveAccounts();
  return accounts[index];
}

export function deleteAccount(id: string): boolean {
  const index = accounts.findIndex(a => a.id === id);
  if (index === -1) return false;
  
  accounts.splice(index, 1);
  saveAccounts();
  return true;
}

export function getCredentials(account: Account): Record<string, string> {
  const decrypted = decrypt(account.credentials, encryptionKey);
  return JSON.parse(decrypted);
}

export function updateCredentials(accountId: string, credentials: Record<string, string>): void {
  const account = getAccount(accountId);
  if (!account) return;
  
  const encrypted = encrypt(JSON.stringify(credentials), encryptionKey);
  account.credentials = encrypted;
  account.updatedAt = new Date();
  saveAccounts();
}

export function markAccountUsed(id: string): void {
  const account = getAccount(id);
  if (account) {
    account.lastUsed = new Date();
    saveAccounts();
  }
}

export const SUPPORTED_PLATFORMS: Platform[] = [
  {
    id: 'juejin',
    name: '掘金',
    type: 'tech',
    webUrl: 'https://juejin.cn',
    features: [
      { name: '发布文章', supported: true },
      { name: '草稿保存', supported: true },
      { name: '定时发布', supported: false },
      { name: '数据统计', supported: true }
    ]
  },
  {
    id: 'csdn',
    name: 'CSDN',
    type: 'tech',
    webUrl: 'https://www.csdn.net',
    features: [
      { name: '发布文章', supported: true },
      { name: '草稿保存', supported: true },
      { name: '定时发布', supported: false },
      { name: '数据统计', supported: true }
    ]
  },
  {
    id: 'cnblogs',
    name: '博客园',
    type: 'tech',
    webUrl: 'https://www.cnblogs.com',
    features: [
      { name: '发布文章', supported: true },
      { name: '草稿保存', supported: true },
      { name: '定时发布', supported: false },
      { name: '数据统计', supported: false }
    ]
  },
  {
    id: 'segmentfault',
    name: 'SegmentFault',
    type: 'tech',
    webUrl: 'https://segmentfault.com',
    features: [
      { name: '发布文章', supported: true },
      { name: '草稿保存', supported: true },
      { name: '定时发布', supported: false },
      { name: '数据统计', supported: true }
    ]
  },
  {
    id: 'zhihu',
    name: '知乎',
    type: 'social',
    webUrl: 'https://www.zhihu.com',
    features: [
      { name: '发布文章', supported: true },
      { name: '草稿保存', supported: true },
      { name: '定时发布', supported: false },
      { name: '数据统计', supported: true }
    ]
  },
  {
    id: 'wechat',
    name: '微信公众号',
    type: 'media',
    webUrl: 'https://mp.weixin.qq.com',
    features: [
      { name: '发布文章', supported: true },
      { name: '草稿保存', supported: true },
      { name: '定时发布', supported: true },
      { name: '数据统计', supported: true }
    ]
  },
  {
    id: 'jianshu',
    name: '简书',
    type: 'social',
    webUrl: 'https://www.jianshu.com',
    features: [
      { name: '发布文章', supported: true },
      { name: '草稿保存', supported: true },
      { name: '定时发布', supported: false },
      { name: '数据统计', supported: true }
    ]
  },
  {
    id: 'toutiao',
    name: '今日头条',
    type: 'media',
    webUrl: 'https://mp.toutiao.com',
    features: [
      { name: '发布文章', supported: true },
      { name: '草稿保存', supported: true },
      { name: '定时发布', supported: true },
      { name: '数据统计', supported: true }
    ]
  }
];

export function getPlatform(id: string): Platform | undefined {
  return SUPPORTED_PLATFORMS.find(p => p.id === id);
}

export function getPlatformsByType(type: Platform['type']): Platform[] {
  return SUPPORTED_PLATFORMS.filter(p => p.type === type);
}
