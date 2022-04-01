import executor from './ModuleExecuter.js';

async function main() {
   

  const source = "Cepom_SP_SaoPaulo"; // process.argv[2];
  const input = "10480616000160"; // process.argv[3];

  return executor.execute(source, input);
}

// main entry point
(main)();