import { writeFile } from 'fs/promises';
import xEvilCaptchaSolver from '../xEvilCaptchaSolver.js';

export default class {
    
    static Name = "Cepom_SP_SaoPaulo"

    static async execute(page, input) {
        if (!input) return null;

        const [response] = await Promise.all([
            page.waitForResponse(r => r.url().includes('ImagemCaptcha')),
            page.goto('https://cpom.prefeitura.sp.gov.br/prestador/SituacaoCadastral')
        ]);

        await page.waitForSelector('.panel #txtUsuario');
        await page.evaluate((inputVal) => {
            const $input = document.querySelector('.panel #txtUsuario');
            $input.value = inputVal;
            $input.dispatchEvent(new Event('blur'));
        }, [input]);

        await response.finished();
        let buffer = await response.body();

        const captchaSolver = new xEvilCaptchaSolver();
        const captchaSolved = await captchaSolver.solve(buffer.toString('base64'));
        console.log(captchaSolved);
        await page.evaluate((solveVal) => {
            document.querySelector('.panel-body #txtCaptcha')
                .value = solveVal;
            document.querySelector('.panel > .panel-footer > .row > .col-md-6 > .btn-primary')
                .click();
        }, [captchaSolved]);

        await page.waitForFunction(() =>
            document.querySelector('body').innerText.includes('CNPJ inválido')
            || document.querySelector('body').innerText.includes('Texto da imagem inválido')
            || document.querySelector('body').innerText.includes('Informações do Prestador')
        );

        const modal = await Promise.race([
            page.waitForSelector('.bootbox-body'),
            page.waitForSelector('#prestadorInfo')
        ]);

        const text = await modal.textContent();
        const succeed = text.includes('Informações do Prestador');

        let result = null;
        if (succeed) {
            await page.click('[value="Imprimir"]');
            const download = await page.waitForEvent('download');
            //await download.saveAs(`/tmp/abc/${this.Name}_${input}.pdf`);
            //const file = await download.createReadStream();
            //await writeFile(`output/Original${this.Name}_${input}.pdf`, file);

            // Succeed
            result = { status: 'succeed', value: await (await page.waitForSelector('#divteste > span > b')).textContent() };
        } else {
            // Failed
            // <div class="bootbox-body">Texto da imagem inválido.</div>
            // <div class="bootbox-body">CNPJ inválido.</div>
            result = { status: 'failed', value: await (await page.waitForSelector('.modal-dialog .bootbox-body')).textContent() };
        }

        return { input, status: result.status, result: { message: result.value } };
    }
}