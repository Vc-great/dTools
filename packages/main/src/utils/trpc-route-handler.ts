import { appRouter } from '@main/routes/index.js';
import { ipcMain } from "electron";

/**
 * 动态tRPC路由处理器
 * 自动解析路径并调用相应的tRPC过程
 */
export class TRPCRouteHandler {
  private caller = appRouter.createCaller({});

  /**
   * 执行tRPC过程调用
   * @param path - tRPC路径，如 'projectRouter.findAllProjects'
   * @param input - 输入参数
   * @returns 执行结果
   */
  async execute(path: string, input?: any) {
    try {
      const pathParts = path.split('.');

      // 动态访问嵌套的过程
      let procedure = this.caller as any;
      for (const part of pathParts) {
        if (procedure[part]) {
          procedure = procedure[part];
        } else {
          throw new Error(`Procedure not found at path: ${path}. Available procedures: ${Object.keys(procedure).join(', ')}`);
        }
      }

      // 验证最终的procedure是否是函数
      if (typeof procedure !== 'function') {
        throw new Error(`Path ${path} does not point to a valid procedure`);
      }

      console.log(`Executing tRPC procedure at path: ${path}`);
      return await procedure(input);

    } catch (error) {
      console.error(`tRPC execution error for path ${path}:`, error);
      throw error;
    }
  }
}

// 导出单例实例
export const trpcRouteHandler = new TRPCRouteHandler();


// 使用新的路由处理器简化tRPC调用


export function ipcMainHandle() {
  ipcMain.handle('trpc', async (event, { path, input }) => {
    return await trpcRouteHandler.execute(path, input);
  });
}
