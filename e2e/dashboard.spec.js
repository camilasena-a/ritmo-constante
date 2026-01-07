import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  test('deve carregar o dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verificar que a página carrega
    await expect(page.locator('h1, h2')).toContainText(/Dashboard|Ritmo Constante/i);
  });

  test('deve exibir estatísticas', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Verificar se há cards de estatísticas
    const statsCards = page.locator('.card, [class*="card"]');
    await expect(statsCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('deve navegar para outras páginas pelo menu', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Testar navegação para Ciclo de Estudos
    await page.click('text=Ciclo de Estudos');
    await expect(page).toHaveURL(/.*study-cycle/);
    
    // Voltar e testar Revisões
    await page.goto('/dashboard');
    await page.click('text=Revisões');
    await expect(page).toHaveURL(/.*revisions/);
    
    // Voltar e testar Estatísticas
    await page.goto('/dashboard');
    await page.click('text=Estatísticas');
    await expect(page).toHaveURL(/.*statistics/);
  });

  test('deve exibir revisões pendentes no dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.waitForLoadState('networkidle');
    
    // Verificar seção de revisões pendentes
    const revisionsSection = page.locator('text=Revisões Pendentes');
    await expect(revisionsSection).toBeVisible({ timeout: 5000 });
  });
});








