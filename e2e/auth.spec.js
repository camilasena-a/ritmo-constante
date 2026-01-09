import { test, expect } from '@playwright/test';

test.describe('Autenticação E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve fazer login com sucesso', async ({ page }) => {
    // Navegar para a página de login
    await page.goto('/login');
    
    // Preencher formulário de login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    
    // Verificar redirecionamento para dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Verificar mensagem de erro
    await expect(page.locator('text=erro')).toBeVisible({ timeout: 5000 });
  });

  test('deve registrar novo usuário', async ({ page }) => {
    await page.goto('/register');
    
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    // Verificar redirecionamento após registro
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('deve validar campos obrigatórios no registro', async ({ page }) => {
    await page.goto('/register');
    
    // Tentar submeter sem preencher campos
    await page.click('button[type="submit"]');
    
    // Verificar que não foi redirecionado
    await expect(page).toHaveURL(/.*register/);
  });
});










