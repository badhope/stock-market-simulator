export enum ErrorCategory {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  RATE_LIMIT = 'RATE_LIMIT',
  VALIDATION = 'VALIDATION',
  CONTENT = 'CONTENT',
  PLATFORM = 'PLATFORM',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorDetail {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  httpStatus?: number;
  platformId?: string;
  timestamp: number;
  context?: Record<string, unknown>;
  stack?: string;
  suggestions: string[];
  documentation?: string;
}

export interface ErrorRecord {
  id: string;
  error: ErrorDetail;
  resolved: boolean;
  resolvedAt?: number;
  resolveNote?: string;
  occurrenceCount: number;
  lastOccurrence: number;
  firstOccurrence: number;
}

export interface ErrorStatistics {
  totalErrors: number;
  byCategory: Record<ErrorCategory, number>;
  bySeverity: Record<ErrorSeverity, number>;
  byPlatform: Record<string, number>;
  hourlyDistribution: number[];
  dailyDistribution: number[];
  topErrors: ErrorRecord[];
  errorRate: number;
  avgResolutionTime: number;
}

export const ERROR_DEFINITIONS: Record<string, Omit<ErrorDetail, 'timestamp' | 'context' | 'stack'>> = {
  'E404': {
    code: 'E404',
    message: '资源不存在',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    httpStatus: 404,
    suggestions: [
      '检查请求的URL是否正确',
      '确认资源是否已被删除',
      '验证API端点是否已变更',
      '检查平台API文档获取最新端点'
    ],
    documentation: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/404'
  },
  'E401': {
    code: 'E401',
    message: '未授权访问',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    httpStatus: 401,
    suggestions: [
      '检查Cookie或Token是否有效',
      '确认账号是否已登录',
      '验证认证信息是否正确配置',
      '尝试重新登录获取新的凭证'
    ],
    documentation: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/401'
  },
  'E403': {
    code: 'E403',
    message: '禁止访问',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.HIGH,
    httpStatus: 403,
    suggestions: [
      '检查账号是否有权限执行此操作',
      '确认账号状态是否正常（未被封禁）',
      '验证请求是否符合平台规则',
      '联系平台客服了解详情'
    ],
    documentation: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/403'
  },
  'E429': {
    code: 'E429',
    message: '请求过于频繁',
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    httpStatus: 429,
    suggestions: [
      '降低请求频率',
      '增加请求间隔时间',
      '等待一段时间后重试',
      '检查平台API限制规则'
    ],
    documentation: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/429'
  },
  'E400': {
    code: 'E400',
    message: '请求参数错误',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    httpStatus: 400,
    suggestions: [
      '检查请求参数格式是否正确',
      '验证必填字段是否完整',
      '确认参数类型是否匹配',
      '查看API文档了解参数要求'
    ],
    documentation: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/400'
  },
  'E500': {
    code: 'E500',
    message: '服务器内部错误',
    category: ErrorCategory.PLATFORM,
    severity: ErrorSeverity.HIGH,
    httpStatus: 500,
    suggestions: [
      '稍后重试请求',
      '检查平台服务状态',
      '如持续出现，联系平台技术支持',
      '记录错误详情以便排查'
    ],
    documentation: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/500'
  },
  'E502': {
    code: 'E502',
    message: '网关错误',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    httpStatus: 502,
    suggestions: [
      '检查网络连接状态',
      '稍后重试请求',
      '检查代理设置是否正确',
      '验证平台服务是否正常'
    ],
    documentation: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/502'
  },
  'E503': {
    code: 'E503',
    message: '服务暂时不可用',
    category: ErrorCategory.PLATFORM,
    severity: ErrorSeverity.MEDIUM,
    httpStatus: 503,
    suggestions: [
      '等待一段时间后重试',
      '检查平台维护公告',
      '使用备用平台发布',
      '设置自动重试机制'
    ],
    documentation: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/503'
  },
  'E_TIMEOUT': {
    code: 'E_TIMEOUT',
    message: '请求超时',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      '检查网络连接稳定性',
      '增加请求超时时间',
      '使用更稳定的网络环境',
      '考虑使用代理服务器'
    ]
  },
  'E_DNS': {
    code: 'E_DNS',
    message: 'DNS解析失败',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    suggestions: [
      '检查网络连接',
      '尝试更换DNS服务器',
      '检查域名是否正确',
      '清除DNS缓存'
    ]
  },
  'E_CAPTCHA': {
    code: 'E_CAPTCHA',
    message: '需要验证码验证',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      '使用交互模式完成验证',
      '降低请求频率避免触发',
      '更新Cookie重新尝试',
      '使用Puppeteer处理验证码'
    ]
  },
  'E_CONTENT_SENSITIVE': {
    code: 'E_CONTENT_SENSITIVE',
    message: '内容包含敏感词',
    category: ErrorCategory.CONTENT,
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      '检查文章内容是否包含敏感词',
      '修改或删除敏感内容',
      '使用内容过滤工具检测',
      '了解平台内容审核规则'
    ]
  },
  'E_CONTENT_DUPLICATE': {
    code: 'E_CONTENT_DUPLICATE',
    message: '内容重复',
    category: ErrorCategory.CONTENT,
    severity: ErrorSeverity.LOW,
    suggestions: [
      '检查是否已发布相同内容',
      '修改文章标题或内容',
      '使用更新接口而非创建',
      '确认发布状态'
    ]
  },
  'E_COOKIE_EXPIRED': {
    code: 'E_COOKIE_EXPIRED',
    message: 'Cookie已过期',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    suggestions: [
      '重新登录平台获取新Cookie',
      '检查Cookie有效期设置',
      '启用Cookie过期提醒',
      '定期更新账号凭证'
    ]
  },
  'E_ACCOUNT_BANNED': {
    code: 'E_ACCOUNT_BANNED',
    message: '账号已被封禁',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.CRITICAL,
    suggestions: [
      '联系平台客服了解封禁原因',
      '申诉解封',
      '使用备用账号',
      '检查是否违反平台规则'
    ]
  },
  'E_NETWORK_OFFLINE': {
    code: 'E_NETWORK_OFFLINE',
    message: '网络连接断开',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    suggestions: [
      '检查网络连接',
      '重试请求',
      '切换网络环境',
      '检查防火墙设置'
    ]
  },
  'E_SSL': {
    code: 'E_SSL',
    message: 'SSL证书错误',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    suggestions: [
      '检查系统时间是否正确',
      '更新根证书',
      '检查是否被中间人攻击',
      '暂时禁用SSL验证（仅开发环境）'
    ]
  },
  'E_UNKNOWN': {
    code: 'E_UNKNOWN',
    message: '未知错误',
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      '查看详细错误信息',
      '检查日志文件',
      '联系技术支持',
      '提交Issue反馈'
    ]
  }
};
