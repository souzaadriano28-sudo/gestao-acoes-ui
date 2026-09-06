import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const username = process.env['E2E_RUNTIME_ADMIN_USERNAME'] ?? process.env['E2E_ADMIN_USERNAME'];
const password = process.env['E2E_RUNTIME_ADMIN_PASSWORD'] ?? process.env['E2E_ADMIN_PASSWORD'];

test('autenticação segura, acessibilidade e jornada real BRL/USD', async ({ page, context }) => {
  if (!username || !password) throw new Error('E2E admin credentials must be supplied only through the runtime environment');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/carteira');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: 'Acesse o Atlas' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pular para o formulário de acesso' })).toBeFocused();
  await page.setViewportSize({ width: 320, height: 720 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.setViewportSize({ width: 720, height: 512 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.getByRole('button', { name: /Entrar com/ })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const passwordInput=page.getByLabel('Senha', { exact: true });
  await passwordInput.fill(password);
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(passwordInput).toHaveAttribute('type','text');
  await expect(passwordInput).toHaveValue(password);
  await page.getByLabel('Usuário').fill(username);
  await page.getByRole('button', { name: 'Entrar com segurança' }).click();
  await expect(page).toHaveURL(/\/carteira/);

  await context.clearCookies();
  await page.getByRole('link', { name: 'Ações' }).click();
  await expect(page.getByText('Sua sessão expirou. Entre novamente para continuar.')).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1024 });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel('Usuário').fill(username); await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar com segurança' }).click();
  await expect(page).toHaveURL(/\/acoes/);

  await page.goto('/corretoras');
  await page.getByPlaceholder(/CNPJ/).fill('11.222.333/0001-81');
  await page.getByPlaceholder(/CEP/).fill('01001000');
  const brokerRequest=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/corretoras' && request.method()==='POST');
  await page.getByRole('button', { name: /Cadastrar/ }).click();
  expect((await brokerRequest).headers()['x-csrf-token']).toBeTruthy();
  await expect(page.getByText('Corretora Teste')).toBeVisible();

  const actionsLoaded = page.waitForResponse(response =>
    new URL(response.url()).pathname === '/api/acoes'
      && response.request().method() === 'GET'
      && response.ok()
  );
  await page.getByRole('link', { name: /Ações/ }).click();
  await actionsLoaded;
  await page.getByPlaceholder(/Ticker/).fill('PETR4');
  await page.locator('select').selectOption('BRASIL');
  await page.getByRole('button', { name: /Buscar Ativo/ }).click();
  await expect(page.getByText('PETR4', { exact: true })).toBeVisible();
  await page.getByPlaceholder(/Ticker/).fill('AAPL');
  await page.locator('select').selectOption('AMERICANO');
  await page.getByRole('button', { name: /Buscar Ativo/ }).click();
  await expect(page.getByText('AAPL', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: /Minha Carteira/ }).click();
  const assetSelect = page.locator('select').nth(0);
  const brokerSelect = page.locator('select').nth(1);
  const quantity = page.locator('input[type=number]');
  await assetSelect.selectOption({ label: 'PETR4 (BRASIL)' });
  await brokerSelect.selectOption({ label: 'Corretora Teste' });
  await quantity.fill('10');
  await page.getByRole('button', { name: 'Confirmar Compra' }).click();
  await expect(page.getByText('10 cotas', { exact: true })).toBeVisible();
  await assetSelect.selectOption({ label: 'AAPL (AMERICANO)' });
  await quantity.fill('2');
  await page.getByRole('button', { name: 'Confirmar Compra' }).click();
  await expect(page.getByText('2 cotas', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'VENDER' }).click();
  await assetSelect.selectOption({ label: 'PETR4 (BRASIL)' });
  await quantity.fill('4');
  await page.getByRole('button', { name: 'Confirmar Venda' }).click();
  await expect(page.getByText(/6 cotas/)).toBeVisible();
  await expect(page.getByText(/2 cotas/)).toBeVisible();
  await expect(page.getByText(/1[.,]180[.,]00/)).toBeVisible();

  const exactTotal = await page.request.get('/api/carteira/saldo-total');
  expect(exactTotal.ok()).toBe(true);
  expect(await exactTotal.text()).toBe('1180.00');

  await quantity.fill('99');
  await page.getByRole('button', { name: 'Confirmar Venda' }).click();
  await expect(page.getByText(/insuficiente/)).toBeVisible();

  await page.request.post('http://127.0.0.1:9090/control/fail-brapi-after-one-success');
  await page.getByRole('button', { name: 'COMPRAR' }).click();
  await quantity.fill('1');
  await page.getByRole('button', { name: 'Confirmar Compra' }).click();
  await expect(page.getByText(/confirmada, mas os dados/)).toBeVisible();

  await page.route('**/api/carteira/comprar', async route => {
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    await route.abort('connectionfailed');
  }, { times: 1 });
  await quantity.fill('1');
  await page.getByRole('button', { name: 'Confirmar Compra' }).click();
  await expect(page.getByText(/confirmar o resultado/)).toBeVisible();

  const positions = await page.request.get('/api/carteira/posicoes');
  expect(positions.ok()).toBe(true);
  const persisted = await positions.json();
  expect(persisted.find((item: any) => item.ticker === 'PETR4').quantidade).toBe(8);

  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/carteira'); await expect(page).toHaveURL(/\/login/);
  for (let attempt=0;attempt<5;attempt++) {
    await page.getByLabel('Usuário').fill(username); await page.getByLabel('Senha', { exact: true }).fill('deliberately-invalid-password');
    const rejected=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/login');
    await page.getByRole('button', { name: 'Entrar com segurança' }).click();
    expect((await rejected).status()).toBe(401);
    await expect(page.getByText(/Não foi possível entrar/)).toBeVisible();
  }
  await page.getByLabel('Usuário').fill(username); await page.getByLabel('Senha', { exact: true }).fill(password);
  const limited=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/login');
  await page.getByRole('button', { name: 'Entrar com segurança' }).click();
  expect((await limited).status()).toBe(429);
  await expect(page.getByText(/Acesso temporariamente indisponível/)).toBeVisible();
});
