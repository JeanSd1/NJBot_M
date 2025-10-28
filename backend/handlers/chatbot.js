const Empresa = require('../models/Empresa');
const { gerarResposta } = require('../services/iaService');

async function handleMensagem(empresaId, mensagemUsuario) {
  const empresa = await Empresa.findById(empresaId);
  if (!empresa) return { resposta: '⚠️ Empresa não encontrada.' };

  const respostaIA = await gerarResposta(empresa, mensagemUsuario);

  return {
    resposta: respostaIA
  };
}

module.exports = handleMensagem;
