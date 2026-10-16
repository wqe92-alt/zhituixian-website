import type { SupportProvider } from '../types';
import { dify } from './dify';

// 新服务商在这里注册：键名即 support.config.ts 里 provider 的取值
export const providers: Record<string, SupportProvider> = {
  dify,
};
