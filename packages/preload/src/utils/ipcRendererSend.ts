import {ipcRenderer} from 'electron';


export function ipcRendererSend(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}
