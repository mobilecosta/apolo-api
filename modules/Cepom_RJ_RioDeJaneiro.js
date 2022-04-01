import xEvilCaptchaSolver from '../xEvilCaptchaSolver.js';

export default class {
    
    static Name = "Cepom_RJ_RioDeJaneiro"

    static async execute(page, input) {
        if (!input) return null;

        const [response] = await Promise.all([
            page.waitForResponse(r => r.url().includes('SituacaoCadastral/GetCaptcha')),
            page.goto(`https://cepomweb.rio.gov.br/SituacaoCadastral/Index`)
        ]);

        // fill input
        await page.waitForSelector('.divForm #Cnpj');
        await page.evaluate((inputVal) => {
            const $input = document.querySelector('.divForm #Cnpj');
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
            document.querySelector('.divForm #Captcha')
                .value = solveVal;
            document.querySelector('.divForm #Submit')
                .click();
        }, [captchaSolved]);

        await page.waitForNavigation();
        const succeed = await page.evaluate(() => {
            return document.querySelector('body').innerText.includes('Dados do Prestador');
        });

        let result = null;
        if (succeed) {
            // Succeed
            result = { status: 'succeed', value: await (await page.waitForSelector('#main > div > div.divForm > form > fieldset > div:nth-child(3) > table > tbody > tr:nth-child(1) > td > p')).textContent() };
        } else {
            // Failed
            // <div class="bootbox-body">Texto da imagem inválido.</div>
            // <div class="bootbox-body">CNPJ inválido.</div>
            result = { status: 'failed', value: await (await page.waitForSelector('#main > div > div.divForm > form > div.validation-summary-errors.quadroError.mt10 > ul > li')).textContent() };
        }

        return { input, status: result.status, result: { message: result.value } };
    }
}