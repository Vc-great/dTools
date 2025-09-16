import { initTRPC } from '@trpc/server';


// 创建基础的tRPC实例
const t = initTRPC.create();

// 导出基础的tRPC实例供其他服务使用
export const trpc = t;


