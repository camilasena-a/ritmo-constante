# Configuração do GitHub Pages

Este documento explica como configurar o GitHub Pages para servir a aplicação React corretamente.

## Configuração Automática (Recomendado)

O projeto já possui um workflow do GitHub Actions configurado que faz o deploy automático sempre que você fizer push na branch `main` ou `master`.

### Passos para ativar:

1. **Ative o GitHub Pages no repositório:**
   - Vá em Settings → Pages
   - Em "Source", selecione "GitHub Actions"
   - Salve as configurações

2. **Faça push das alterações:**
   ```bash
   git add .
   git commit -m "Configurar GitHub Pages"
   git push origin main
   ```

3. **Aguarde o workflow executar:**
   - Vá em Actions no GitHub
   - Aguarde o workflow "Deploy to GitHub Pages" completar
   - Acesse sua aplicação em: `https://camilasena-a.github.io/ritmo-constante/`

## Configuração Manual (Alternativa)

Se preferir fazer o deploy manualmente:

1. **Faça o build da aplicação:**
   ```bash
   cd frontend
   npm install
   VITE_BASE_PATH=/ritmo-constante/ npm run build
   ```

2. **Configure o GitHub Pages:**
   - Vá em Settings → Pages
   - Em "Source", selecione a branch `main` ou `master`
   - Em "Folder", selecione `/frontend/dist`
   - Salve as configurações

3. **Faça commit e push da pasta dist:**
   ```bash
   git add frontend/dist
   git commit -m "Deploy para GitHub Pages"
   git push origin main
   ```

## Importante

- O base path está configurado como `/ritmo-constante/` no workflow
- Se você mudar o nome do repositório, atualize o `VITE_BASE_PATH` no arquivo `.github/workflows/deploy.yml`
- O arquivo `.nojekyll` é criado automaticamente durante o build para desabilitar o Jekyll
- O arquivo `404.html` é copiado automaticamente para permitir roteamento SPA no GitHub Pages

## Troubleshooting

### A página mostra apenas o README
- Certifique-se de que o GitHub Pages está configurado para usar "GitHub Actions" como source
- Verifique se o workflow foi executado com sucesso em Actions

### Rotas não funcionam (404)
- Certifique-se de que o arquivo `404.html` está na pasta `dist`
- Verifique se o base path está correto no `vite.config.js`

### Assets não carregam
- Verifique se o `VITE_BASE_PATH` está configurado corretamente
- Certifique-se de que o base path no `vite.config.js` corresponde ao nome do repositório
