import fse from 'fs-extra'
import fs from 'fs'
import path from 'path'
/**
 * 读取设置文件
 */
export  function writeJsonFileSync(filePath:string, data:Object): void {

  try {
    //父级目录不存在则创建
     fse.ensureDirSync(path.dirname(filePath))

    return  fse.writeJSONSync(filePath, JSON.parse(JSON.stringify(data)), { spaces: 2 })

  } catch (error) {
    console.error("Failed to read file:", error);
    throw error;
  }
}
