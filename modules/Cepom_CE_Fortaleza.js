import xEvilCaptchaSolver from '../xEvilCaptchaSolver.js';

export default class {
    
    static Name = "Cepom_CE_Fortaleza"

    static async execute(page, input) {
        if (!input) return null;

        const [response] = await Promise.all([
            page.waitForResponse(r => r.url().includes('seam/resource/captcha')),
            page.goto(`https://issadmin.sefin.fortaleza.ce.gov.br/grpfor/pagesPublic/cpom/consultarCartaoInscricao.seam`)
        ]);

        // fill input
        await page.waitForSelector('[id="pesquisaForm:cnpj"]');
        await page.evaluate((inputVal) => {
            const $input = document.querySelector('[id="pesquisaForm:cnpj"]');
            $input.value = inputVal;
            $input.dispatchEvent(new Event('blur'));
        }, [input]);
        
        // wait captcha imagem response
        await response.finished();
        let buffer = await response.body();
        
        // solva captcha
        const captchaSolver = new xEvilCaptchaSolver();
        const captchaSolved = await captchaSolver.solve(buffer.toString('base64'));
        await page.evaluate((solveVal) => {
            document.querySelector('[id="pesquisaForm:captchaDecor"] > input')
                .value = solveVal;
            document.querySelector('[id="pesquisaForm:j_id397"]')
                .click();
        }, [captchaSolved]);

        //await page.waitForNavigation();
        const succeed = await page.evaluate(() => {
            return document.querySelector('[id="pesquisaForm:mensagens"] > dt > span.rich-messages-marker > img') == false;
        });
        //Digite os caracteres da imagem novamente.
        console.log('img', succeed);
        let result = null;
        if (succeed) {
            // Succeed
            result = { status: 'succeed', value: await (await page.waitForSelector('#main > div > div.divForm > form > fieldset > div:nth-child(3) > table > tbody > tr:nth-child(1) > td > p')).textContent() };
        } else {
            // Failed
            // <div class="bootbox-body">Texto da imagem inválido.</div>
            // <div class="bootbox-body">CNPJ inválido.</div>
            result = { status: 'succeed', value: await (await page.waitForSelector('[id="pesquisaForm:mensagens"] > dt > span.rich-messages-label')).textContent() };
        }

        return { input, status: result.status, result: { message: result.value } };
    }
}