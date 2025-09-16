import fse from 'fs-extra'
/**
 * 读取设置文件
 */
 export  function readJsonFileSync<T>(filePath:string): T {

  try {
    return  fse.readJSONSync(filePath, "utf-8") as T

  } catch (error) {
    console.error("Failed to read file:", error);
    throw error;
  }
}



