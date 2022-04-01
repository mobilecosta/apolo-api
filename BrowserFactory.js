import Debug from 'debug';
import { chromium } from 'playwright';

const d = Debug('Az').extend('BrowserFactory');

export default class {
    static _wsEndpoint = 'ws://172.22.152.129:6789?token=4c0a2bae78865b9b29';

    static create(workspaceId) {

        //return this.websocket(workspaceId);
        return this.local(workspaceId);

    }

    static async websocket(workspaceId) {

        d('Creating Google Chromium at %s', this._wsEndpoint);
        const browser = await chromium.connectOverCDP({
            wsEndpoint: this._wsEndpoint + `&trackingId=${workspaceId}`
        });

        d('Created Google Chromium %s at %s', browser.version(), this._wsEndpoint);
        return browser;

    }

    static local() {

        d('Create instance of local');
        return chromium.launch({
            headless: false, //defaults to true 
            defaultViewport: null, //Defaults to an 800x600 viewport
            args: ['--start-fullscreen']
        });

    }

    static dispose(browser) {

        d('Dispose instance %s', browser.version());
        browser.close();

    }
}