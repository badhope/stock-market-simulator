import fs from 'fs';
import path from 'path';
import grayMatter from 'gray-matter';
import { Article, ArticlePlatform, Template } from '../types/index.js';
import { generateId } from '../utils/crypto.js';
import { getDataPath, ensureDataDir } from '../utils/config.js';

const ARTICLES_DIR = 'articles';
const TEMPLATES_FILE = 'templates.json';

let templates: Template[] = [];

export function initArticleManager(): void {
  ensureDataDir();
  const articlesDir = getDataPath(ARTICLES_DIR);
  if (!fs.existsSync(articlesDir)) {
    fs.mkdirSync(articlesDir, { recursive: true });
  }
  loadTemplates();
}

function loadTemplates(): void {
  const filePath = getDataPath(TEMPLATES_FILE);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    templates = JSON.parse(content);
  }
}

function saveTemplates(): void {
  const filePath = getDataPath(TEMPLATES_FILE);
  fs.writeFileSync(filePath, JSON.stringify(templates, null, 2));
}

export function createArticle(
  title: string,
  content: string,
  options?: {
    summary?: string;
    tags?: string[];
    category?: string;
    coverImage?: string;
  }
): Article {
  const article: Article = {
    id: generateId(),
    title,
    content,
    summary: options?.summary,
    tags: options?.tags || [],
    category: options?.category,
    coverImage: options?.coverImage,
    status: 'draft',
    platforms: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  saveArticle(article);
  return article;
}

export function saveArticle(article: Article): void {
  const articlesDir = getDataPath(ARTICLES_DIR);
  const filePath = path.join(articlesDir, `${article.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(article, null, 2));
}

export function getArticle(id: string): Article | undefined {
  const articlesDir = getDataPath(ARTICLES_DIR);
  const filePath = path.join(articlesDir, `${id}.json`);
  
  if (!fs.existsSync(filePath)) return undefined;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

export function getAllArticles(): Article[] {
  const articlesDir = getDataPath(ARTICLES_DIR);
  if (!fs.existsSync(articlesDir)) return [];
  
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const content = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
    return JSON.parse(content);
  });
}

export function updateArticle(id: string, updates: Partial<Article>): Article | undefined {
  const article = getArticle(id);
  if (!article) return undefined;
  
  const updated = {
    ...article,
    ...updates,
    updatedAt: new Date()
  };
  
  saveArticle(updated);
  return updated;
}

export function deleteArticle(id: string): boolean {
  const articlesDir = getDataPath(ARTICLES_DIR);
  const filePath = path.join(articlesDir, `${id}.json`);
  
  if (!fs.existsSync(filePath)) return false;
  
  fs.unlinkSync(filePath);
  return true;
}

export function importFromFile(filePath: string): Article {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: body } = grayMatter(content);
  
  return createArticle(
    data.title || path.basename(filePath, '.md'),
    body,
    {
      summary: data.summary || data.description,
      tags: data.tags || [],
      category: data.category,
      coverImage: data.cover || data.image
    }
  );
}

export function exportToFile(article: Article, outputPath: string): void {
  const frontMatter = {
    title: article.title,
    summary: article.summary,
    tags: article.tags,
    category: article.category,
    cover: article.coverImage,
    date: article.createdAt,
    updated: article.updatedAt
  };
  
  const content = grayMatter.stringify(article.content, frontMatter);
  fs.writeFileSync(outputPath, content);
}

export function createTemplate(
  name: string,
  content: string,
  options?: {
    description?: string;
    tags?: string[];
    category?: string;
  }
): Template {
  const template: Template = {
    id: generateId(),
    name,
    description: options?.description,
    content,
    tags: options?.tags || [],
    category: options?.category,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  templates.push(template);
  saveTemplates();
  
  return template;
}

export function getTemplate(id: string): Template | undefined {
  return templates.find(t => t.id === id);
}

export function getAllTemplates(): Template[] {
  return templates;
}

export function updateTemplate(id: string, updates: Partial<Template>): Template | undefined {
  const index = templates.findIndex(t => t.id === id);
  if (index === -1) return undefined;
  
  templates[index] = {
    ...templates[index],
    ...updates,
    updatedAt: new Date()
  };
  
  saveTemplates();
  return templates[index];
}

export function deleteTemplate(id: string): boolean {
  const index = templates.findIndex(t => t.id === id);
  if (index === -1) return false;
  
  templates.splice(index, 1);
  saveTemplates();
  return true;
}

export function applyTemplate(templateId: string, title: string): Article | undefined {
  const template = getTemplate(templateId);
  if (!template) return undefined;
  
  return createArticle(title, template.content, {
    tags: template.tags,
    category: template.category
  });
}

export function updatePublishStatus(
  articleId: string,
  platformId: string,
  status: ArticlePlatform['status'],
  result?: { url?: string; articleId?: string; error?: string }
): void {
  const article = getArticle(articleId);
  if (!article) return;
  
  const platformIndex = article.platforms.findIndex(p => p.platformId === platformId);
  
  const platformData: ArticlePlatform = {
    platformId,
    accountId: article.platforms[platformIndex]?.accountId || '',
    status,
    url: result?.url,
    articleId: result?.articleId,
    error: result?.error,
    publishedAt: status === 'published' ? new Date() : undefined
  };
  
  if (platformIndex === -1) {
    article.platforms.push(platformData);
  } else {
    article.platforms[platformIndex] = {
      ...article.platforms[platformIndex],
      ...platformData
    };
  }
  
  const allPublished = article.platforms.every(p => p.status === 'published');
  
  if (allPublished) {
    article.status = 'published';
    article.publishedAt = new Date();
  }
  
  saveArticle(article);
}

export function getArticlesByStatus(status: Article['status']): Article[] {
  return getAllArticles().filter(a => a.status === status);
}

export function getArticlesByPlatform(platformId: string): Article[] {
  return getAllArticles().filter(a => 
    a.platforms.some(p => p.platformId === platformId)
  );
}
