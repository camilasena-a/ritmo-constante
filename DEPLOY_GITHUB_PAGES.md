# 🚀 Guia de Deploy no GitHub Pages

Este guia explica como fazer deploy do frontend no GitHub Pages.

## ⚠️ Limitações Importantes

**GitHub Pages só serve arquivos estáticos!** Isso significa:

1. ✅ O **frontend** pode ser hospedado no GitHub Pages
2. ❌ O **backend** precisa estar hospedado em outro lugar:
   - Railway
   - Render
   - Heroku
   - Vercel (com serverless functions)
   - DigitalOcean
   - AWS
   - Outros serviços de hospedagem Node.js

## 📋 Pré-requisitos

1. Repositório no GitHub
2. Backend já hospedado e funcionando
3. URL do backend para configurar a variável de ambiente

## 🔧 Configuração

### Passo 1: Habilitar GitHub Pages no Repositório

1. Vá em **Settings** do seu repositório
2. No menu lateral, clique em **Pages**
3. Em **Source**, selecione **GitHub Actions**

### Passo 2: Configurar Secrets (Opcional mas Recomendado)

Se você quiser configurar a URL da API via secrets:

1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Clique em **New repository secret**
3. Nome: `VITE_API_URL`
4. Valor: URL completa da sua API (ex: `https://seu-backend.railway.app/api`)

### Passo 3: Ajustar o Base Path (se necessário)

O workflow já está configurado para usar o nome do repositório como base path. Se o nome do seu repositório for diferente de `ritmo-constante`, você pode:

**Opção A:** Editar o workflow `.github/workflows/deploy-pages.yml` e alterar:
```yaml
VITE_BASE_PATH: /${{ github.event.repository.name }}/
```

**Opção B:** Se quiser usar a raiz (`/`), altere para:
```yaml
VITE_BASE_PATH: /
```

### Passo 4: Fazer Deploy

1. Faça commit e push das alterações:
```bash
git add .
git commit -m "Configurar deploy no GitHub Pages"
git push origin main
```

2. O GitHub Actions irá automaticamente:
   - Instalar dependências
   - Fazer build do frontend
   - Fazer deploy no GitHub Pages

3. Aguarde alguns minutos e acesse:
   - `https://seu-usuario.github.io/ritmo-constante/`
   - (Substitua `seu-usuario` e `ritmo-constante` pelos valores corretos)

## 🔍 Verificar o Deploy

1. Vá em **Actions** no seu repositório
2. Veja o workflow "Deploy to GitHub Pages"
3. Se der erro, verifique os logs

## 🐛 Troubleshooting

### Problema: Páginas não carregam (404)

**Solução:** Verifique se o `VITE_BASE_PATH` está correto no workflow. Deve corresponder ao nome do repositório.

### Problema: API não funciona

**Solução:** 
1. Configure a variável de ambiente `VITE_API_URL` no workflow ou como secret
2. Certifique-se de que o backend está rodando e acessível
3. Verifique CORS no backend para permitir requisições do domínio do GitHub Pages

### Problema: Rotas do React Router não funcionam

**Solução:** O arquivo `404.html` já está configurado para redirecionar para `index.html`. Se ainda não funcionar, verifique se o arquivo está na pasta `frontend/`.

## 📝 Notas Adicionais

- O build é feito automaticamente a cada push na branch `main` ou `master`
- Você também pode fazer deploy manualmente através da aba **Actions** → **Deploy to GitHub Pages** → **Run workflow**
- O frontend será atualizado automaticamente quando você fizer push de alterações

## 🔗 Links Úteis

- [Documentação do GitHub Pages](https://docs.github.com/en/pages)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Vite - Deploy Guide](https://vitejs.dev/guide/static-deploy.html#github-pages)
