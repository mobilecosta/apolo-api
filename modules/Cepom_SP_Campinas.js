export default class {
    
    static Name = "Cepom_SP_Campinas"

    static async execute(page, input) {
        if (!input) return null;

        await page.goto('https://cene.campinas.sp.gov.br/cene-web/acesso.html');
        await page.click('[name="btn_Requerente"]');
        await page.click('[id="j_id38:j_id40:j_id41"]');        
        await page.click('[name="btn_SituacaoCadastralPrestadores"]');        

        await page.waitForSelector('[id="situacaoCadastralForm:palavraChave"]');
        await page.evaluate((inputVal) => {
            const $input = document.querySelector('[id="situacaoCadastralForm:palavraChave"]');
            $input.value = inputVal;
            $input.dispatchEvent(new Event('blur'));
        }, [input]);

        await page.click('[id="situacaoCadastralForm:buttonPesquisar"]');

        const modal = await page.waitForSelector('[id="situacaoCadastralForm:container"]');

        const text = await modal.textContent();
        const succeed = text.includes('Situação');

        let result = null;
        if (succeed) {
            // Succeed
            result = { status: 'succeed', value: await (await page.waitForSelector('[id="situacaoCadastralForm:container"] > label:nth-child(7) > font')).textContent() };
        } else {
            // Failed
            // <div class="bootbox-body">Texto da imagem inválido.</div>
            // <div class="bootbox-body">CNPJ inválido.</div>
            result = { status: 'failed', value: await (await page.waitForSelector('[id="situacaoCadastralForm:container"] > label:nth-child(7) > font')).textContent() };
        }

        return { input, status: result.status, result: { message: result.value } };
    }
}