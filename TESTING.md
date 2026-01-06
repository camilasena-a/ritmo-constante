# Guia de Testes - Ritmo Constante

Este documento descreve a estrutura de testes do projeto e como executá-los.

## Estrutura de Testes

O projeto possui três tipos de testes:

1. **Testes Unitários** - Testam funções e componentes isoladamente
2. **Testes de Integração** - Testam a integração entre componentes e APIs
3. **Testes E2E** - Testam fluxos completos do ponto de vista do usuário

## Testes Unitários

Localizados em `backend/tests/unit/`, testam funções críticas isoladamente.

### Executar Testes Unitários

```bash
# Todos os testes unitários
npm run test:backend:unit

# Ou do diretório backend
cd backend
npm run test:unit
```

### Cobertura

Os testes unitários cobrem:
- Middleware de autenticação (`auth.js`)
- Configuração de autenticação (`config/auth.js`)
- Tratamento de erros (`errorHandler.js`)

## Testes de Integração

Localizados em `backend/tests/integration/`, testam as APIs REST completas.

### Executar Testes de Integração

```bash
# Todos os testes de integração
npm run test:backend:integration

# Ou do diretório backend
cd backend
npm run test:integration
```

### Cobertura

Os testes de integração cobrem:
- API de Autenticação (`/api/auth`)
- API de Revisões (`/api/revisions`)
- API de Matérias (`/api/subjects`)

### Pré-requisitos

Os testes de integração requerem:
- Banco de dados configurado
- Variáveis de ambiente configuradas (`.env` no backend)
- Prisma migrations executadas

## Testes E2E (End-to-End)

Localizados em `e2e/`, testam fluxos completos da aplicação.

### Executar Testes E2E

```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar com interface gráfica
npm run test:e2e:ui

# Executar em modo headed (ver o navegador)
npm run test:e2e:headed
```

### Cobertura

Os testes E2E cobrem:
- Fluxo de autenticação (login, registro)
- Navegação e dashboard
- Gerenciamento de revisões
- Gerenciamento de matérias

### Pré-requisitos

Os testes E2E requerem:
- Backend rodando na porta 3001
- Frontend rodando na porta 5173
- Banco de dados configurado

O Playwright inicia automaticamente os servidores se não estiverem rodando.

## Executar Todos os Testes

```bash
# Executar todos os testes do backend
npm run test:backend

# Executar testes com cobertura
npm run test:backend:coverage
```

## Estrutura de Arquivos

```
.
├── backend/
│   ├── tests/
│   │   ├── setup.js                 # Configuração global
│   │   ├── unit/                    # Testes unitários
│   │   │   ├── middleware/
│   │   │   │   ├── auth.test.js
│   │   │   │   └── errorHandler.test.js
│   │   │   └── config/
│   │   │       └── auth.test.js
│   │   └── integration/             # Testes de integração
│   │       ├── auth.test.js
│   │       ├── revisions.test.js
│   │       └── subjects.test.js
│   └── jest.config.js               # Configuração do Jest
├── e2e/                              # Testes E2E
│   ├── auth.spec.js
│   ├── dashboard.spec.js
│   ├── revisions.spec.js
│   └── subjects.spec.js
└── playwright.config.js              # Configuração do Playwright
```

## Configuração

### Jest (Backend)

Configurado em `backend/jest.config.js`:
- Suporta ES modules
- Cobertura de código
- Timeout de 10 segundos

### Playwright (E2E)

Configurado em `playwright.config.js`:
- Inicia servidores automaticamente
- Screenshots em falhas
- Traces para debug

## Adicionar Novos Testes

### Teste Unitário

Crie um arquivo em `backend/tests/unit/`:

```javascript
import { describe, it, expect } from '@jest/globals';

describe('Minha Função', () => {
  it('deve fazer algo', () => {
    expect(true).toBe(true);
  });
});
```

### Teste de Integração

Crie um arquivo em `backend/tests/integration/`:

```javascript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';

describe('Minha API', () => {
  it('deve responder corretamente', async () => {
    // Seu teste aqui
  });
});
```

### Teste E2E

Crie um arquivo em `e2e/`:

```javascript
import { test, expect } from '@playwright/test';

test('meu teste E2E', async ({ page }) => {
  await page.goto('/');
  // Seu teste aqui
});
```

## CI/CD

Os testes podem ser executados em pipelines CI/CD:

```yaml
# Exemplo GitHub Actions
- name: Run tests
  run: |
    npm run test:backend
    npm run test:e2e
```

## Troubleshooting

### Erros de conexão com banco de dados

Certifique-se de que:
- O banco de dados está rodando
- As variáveis de ambiente estão configuradas
- As migrations foram executadas

### Erros de timeout nos testes E2E

Aumente o timeout no `playwright.config.js` ou verifique se os servidores estão iniciando corretamente.

### Erros de módulos ES

Certifique-se de que o Jest está configurado corretamente para ES modules no `jest.config.js`.







