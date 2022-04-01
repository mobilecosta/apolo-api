export default class {
    
    static Name = "Cepom_PR_Curitiba"

    static async execute(page, input) {
        if (!input) return null;

        await page.goto(`http://isscuritiba.curitiba.pr.gov.br/cpom/PrestadorFora/consultaPrestadorFora.aspx?numCNPJ=${input}`);

        const succeed = await page.evaluate(() => {
            return document.querySelector('body').innerText.includes('Cadastro de Prestadores de Serviços de Outros Municípios');
        });

        let result = null;
        if (succeed) {
            // Succeed
            result = { status: 'succeed', value: await (await page.waitForSelector('#lblSituacao')).textContent() };
        } else {
            // Failed
            // <div class="bootbox-body">Texto da imagem inválido.</div>
            // <div class="bootbox-body">CNPJ inválido.</div>
            result = { status: 'failed', value: await (await page.waitForSelector('#lblSituacao')).textContent() };
        }

        return { input, status: result.status, result: { message: result.value } };
    }
}