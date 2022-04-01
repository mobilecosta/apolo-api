import fetch from 'node-fetch';
import FormData from 'form-data';
import Poller from 'promise-poller';
import Debug from 'debug';


const d = Debug('Az').extend('CaptchaSolver').extend('xEvil');
const dSolve = d.extend('solve');
const dIn = d.extend('enqueue');
const dResponse = d.extend('getResult');
const poll = Poller.default;
const _timeout = (millis) => new Promise(resolve => setTimeout(resolve, millis));

export default class {

    constructor(apiKey = '123123', url = 'http://botmaster05.decaptcher.api.nfe.io:52873') {
        this._solver_apiKey = apiKey;
        this._solver_server_url = url;
    }

    async solve(base64) {
        const [enq_status, enq_id] = await this.enqueue(base64);
        
        if (enq_status) {
            const [status, result] = await this._getResponsePolling(enq_id);
            if (status === 'OK') {
                dSolve('response %s %s', status, result);
                return result;
            }
        } else {
            dSolve('enqueued %s', enq_status);
        }

        return null;
    }

    async enqueue(base64) {
        const form = new FormData();
        form.append('key', this._solver_apiKey);
        form.append('method', 'base64');
        form.append('body', base64);
        form.append('proxyType', 'HTTP');

        const url = `${this._solver_server_url}/in.php`;
        const response = await fetch(url, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const body = await response.text();
        dIn("results %o", body);
        if (!body) return null;

        return body.split('|');
    }

    async getResult(id) {
        dResponse('executing %s', id);

        const url = `${this._solver_server_url}/res.php?action=get&key=${this._solver_apiKey}&id=${id}`;
        const response = await fetch(url, { method: 'GET' });
        const body = await response.text();
        dResponse('executed %s, results %o', id, body);

        if (!body) return null;
        
        const [status, resid] = body.split('|');
        if (status !== 'OK') return null;
        
        return [status, resid];
    }

    _getResponse(id) {
        return async () => this.getResult(id);
    }

    async _getResponsePolling(id, retries = 30, interval = 1500, delay = 500) {
        await _timeout(delay);
        return poll({ taskFn: this._getResponse(id), interval, retries });
    }
}