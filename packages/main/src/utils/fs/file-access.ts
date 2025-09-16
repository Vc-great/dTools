import  fse from 'fs-extra'
import fs from "fs/promises";



export async function fileAccess(filePath:string) {
  try {
    await fse.access(filePath,fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch(error) {
    console.error(error)
    throw error;
  }
}

