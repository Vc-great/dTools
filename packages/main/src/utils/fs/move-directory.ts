import fse from 'fs-extra'

async function moveDirectory(sourceDir: string, destinationDir: string): Promise<void> {
  try {
    fse.moveSync(sourceDir,destinationDir)
    } catch (error) {
      throw error
    }
}
