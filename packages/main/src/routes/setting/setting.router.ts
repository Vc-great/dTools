import { trpc } from '@main/utils/trpc-base.ts';
import { settingService } from './setting.service.ts';
import { updateDataPathSchema } from '@shared/schemas';

// 系统设置
export const settingRouter = trpc.router({
  // 获取所有的配置项
  getSettings: trpc.procedure
    .query(async () => {
      return await settingService.getSettings();
    }),

  // 更新数据存储的位置
  updateDataFolderPath: trpc.procedure
    .input(updateDataPathSchema)
    .mutation(async ({ input }) => {
      console.log("-> input",input);
      return await settingService.updateDataFolderPath(input.dataFolderPath);
    }),

});
