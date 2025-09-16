import { AppModule } from "../AppModule.js";
import { ModuleContext } from "../ModuleContext.js";
import installer,{installExtension,REACT_DEVELOPER_TOOLS} from "electron-devtools-installer";


const extensionsDictionary = {
  REACT_DEVELOPER_TOOLS
} as const;

export class ChromeDevToolsExtension implements AppModule {
  readonly #extension: keyof typeof extensionsDictionary;

  constructor({
    extension,
  }: {
    readonly extension: keyof typeof extensionsDictionary;
  }) {
    this.#extension = extension;
  }

  async enable({ app }: ModuleContext): Promise<void> {
    await app.whenReady();

    await installExtension(extensionsDictionary.REACT_DEVELOPER_TOOLS)
      .then((ext) => console.log(`Added Extension:  ${ext.name}`))
      .catch((err) => console.log("An error occurred: ", err));
  }
}

export function chromeDevToolsExtension(
  ...args: ConstructorParameters<typeof ChromeDevToolsExtension>
) {
  return new ChromeDevToolsExtension(...args);
}
