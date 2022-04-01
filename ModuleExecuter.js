import { readdir, writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import Debug from 'debug';
import BrowserFactory from './BrowserFactory.js';

const d = Debug('Az').extend('ModuleExecuter');
const Modules = { };

try {
  const path = './modules/';
  d('Loading Modules from \'%s\'', path);
  const files = await readdir(path);
  for await (const file of files) {
    const m = await import(`${path}/${file}`);
    d('Loaded Module \'%s\'', m.default.Name);
    Modules[m.default.Name] = m.default;
  }
  d('Loaded Modules');
} catch (err) {
  console.error(err);
}

export default class {
  static async execute(moduleName, moduleInput) {

    d('Executing %o', { moduleName, moduleInput });
    if (!moduleName) {
      d('Executed failed: moduleName is null or empty');
    }
    if (!moduleInput) {
      d('Executed failed: moduleInput is null or empty');
    }

    const instance = Modules[moduleName];
    if (!instance) {
      d('Executed failed: moduleName not found %s', moduleName);
    }

    const id = uuidv4();

    const browser = await BrowserFactory.create(id);
    try {

      const context = await browser.newContext({ acceptDownloads: true });
      const page = await context.newPage({ acceptDownloads: true });
      //await page._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: '/tmp', });

      const output = await instance.execute(page, moduleInput);

      d('Executed succeed: %o %O', { moduleName, moduleInput }, output);
      if (output && output.status === 'succeed') {
        const pdf = await page.pdf({ format: 'A4' });
        await writeFile(`output/${instance.Name}_${moduleInput}.pdf`, pdf);
      }

      page.close();

    } catch (error) {

      d('Executed failed: %o %O', { moduleName, moduleInput }, error);

    } finally {

      BrowserFactory.dispose(browser);

    }
  }
}