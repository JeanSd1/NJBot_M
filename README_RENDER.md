# Deploy no Render — instruções

Este repositório contém instruções e um Dockerfile para facilitar deploys no Render.

Opções de deploy (escolha uma):

1) Deploy via Docker (recomendado)

- No painel do Render, crie um novo Web Service e escolha a opção "Docker".
- Aponte para este repositório e para a branch `jean/push-20251029`.
- O Dockerfile já presente usa Node 20 e instala ferramentas de compilação para addons nativos.
- Defina a variável de ambiente PORT se necessário (o Dockerfile expõe 3000 por padrão).

2) Deploy usando o ambiente Node do Render

- O projeto já inclui `.nvmrc` com `20` e `package.json.engines` com `20.x`. Isso indica ao Render a versão desejada.
- No painel do Render, use o tipo "Web Service" com ambiente Node e ative "Clear cache and deploy".

3) Se o build falhar por addon nativo (ffi-napi)

- Tentar mudar para Node 16 (algumas bibliotecas nativas têm compatibilidade melhor). Para isso, altere `.nvmrc` para `16` e mude `engines.node` em `package.json` para `16.x`, commit e push.
- Alternativa: atualizar `ffi-napi` ou dependências relacionadas para versões mais recentes. Teste localmente com Node 20.
- Alternativa robusta: usar Docker (opção 1) para garantir ambiente de build estável.

Comandos úteis localmente (PowerShell):

```powershell
# trocar de versão (nvm-windows)
nvm install 20.11.0
nvm use 20.11.0

# instalar deps e testar rebuild de addon nativo
npm ci
npm rebuild ffi-napi --build-from-source
```

Se precisar, eu ajusto para forçar Node 16 ou faço um PR para atualizar as dependências nativas.
