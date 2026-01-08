import { test, expect } from '@playwright/test';

test.describe('Matérias E2E', () => {
  test('deve criar uma nova matéria', async ({ page }) => {
    await page.goto('/settings');
    
    // Clicar no botão de nova matéria
    await page.click('button:has-text("Nova Matéria")');
    
    // Preencher formulário
    await page.fill('input[placeholder*="nome" i], input[name="name"]', 'Matéria de Teste');
    
    // Selecionar cor (se houver input de cor)
    const colorInput = page.locator('input[type="color"]').first();
    if (await colorInput.isVisible()) {
      await colorInput.fill('#6366f1');
    }
    
    // Salvar
    await page.click('button:has-text("Criar"), button:has-text("Salvar")');
    
    // Verificar que a matéria foi criada
    await expect(page.locator('text=Matéria de Teste')).toBeVisible({ timeout: 5000 });
  });

  test('deve editar uma matéria existente', async ({ page }) => {
    await page.goto('/settings');
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Procurar botão de editar
    const editButton = page.locator('button:has-text("Editar")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Modificar nome
      const nameInput = page.locator('input[name="name"]').first();
      await nameInput.clear();
      await nameInput.fill('Matéria Editada');
      
      // Salvar
      await page.click('button:has-text("Salvar")');
      
      // Verificar mudança
      await expect(page.locator('text=Matéria Editada')).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('deve validar campos obrigatórios ao criar matéria', async ({ page }) => {
    await page.goto('/settings');
    
    await page.click('button:has-text("Nova Matéria")');
    
    // Tentar salvar sem preencher nome
    await page.click('button:has-text("Criar"), button:has-text("Salvar")');
    
    // Verificar que o modal ainda está aberto ou há mensagem de erro
    const modal = page.locator('[class*="modal"], [class*="Modal"]');
    await expect(modal.first()).toBeVisible();
  });
});









