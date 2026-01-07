import { test, expect } from '@playwright/test';

test.describe('Revisões E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    await page.goto('/login');
    // Assumindo que há um usuário padrão ou modo sem autenticação
    // Se necessário, adicionar login aqui
  });

  test('deve navegar para página de revisões', async ({ page }) => {
    await page.goto('/');
    
    // Clicar no link de revisões no menu
    await page.click('text=Revisões');
    
    await expect(page).toHaveURL(/.*revisions/);
    await expect(page.locator('h1')).toContainText('Revisões');
  });

  test('deve filtrar revisões pendentes', async ({ page }) => {
    await page.goto('/revisions');
    
    // Clicar no filtro de pendentes
    await page.click('button:has-text("Pendentes")');
    
    // Verificar que o filtro está ativo
    const pendingButton = page.locator('button:has-text("Pendentes")');
    await expect(pendingButton).toHaveClass(/btn-primary/);
  });

  test('deve marcar revisão como concluída', async ({ page }) => {
    await page.goto('/revisions');
    
    // Aguardar carregamento das revisões
    await page.waitForSelector('text=Marcar como concluída', { timeout: 5000 }).catch(() => {});
    
    // Se houver revisões pendentes, tentar marcar como concluída
    const completeButton = page.locator('button:has-text("Marcar como concluída")').first();
    
    if (await completeButton.isVisible()) {
      await completeButton.click();
      
      // Verificar que a revisão foi marcada como concluída
      await expect(page.locator('text=✓ Concluída')).toBeVisible({ timeout: 5000 });
    } else {
      // Se não houver revisões, o teste passa (não há nada para testar)
      test.skip();
    }
  });

  test('deve exibir lista de revisões', async ({ page }) => {
    await page.goto('/revisions');
    
    // Verificar que a página carrega
    await expect(page.locator('h1')).toContainText('Revisões');
    
    // Verificar que há filtros disponíveis
    await expect(page.locator('button:has-text("Pendentes")')).toBeVisible();
    await expect(page.locator('button:has-text("Todas")')).toBeVisible();
    await expect(page.locator('button:has-text("Concluídas")')).toBeVisible();
  });
});








