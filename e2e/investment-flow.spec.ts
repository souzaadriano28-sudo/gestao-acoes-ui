import { expect, test } from '@playwright/test';

test('jornada real BRL/USD e os três resultados de mutação', async ({ page, request }) => {
  await page.goto('/corretoras');
  await page.getByPlaceholder(/CNPJ/).fill('11.222.333/0001-81');
  await page.getByPlaceholder(/CEP/).fill('01001000');
  await page.getByRole('button', { name: /Cadastrar/ }).click();
  await expect(page.getByText('Corretora Teste')).toBeVisible();

  await page.getByRole('link', { name: /Ações/ }).click();
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
  await assetSelect.selectOption({ label: 'AAPL (AMERICANO)' });
  await quantity.fill('2');
  await page.getByRole('button', { name: 'Confirmar Compra' }).click();
  await page.getByRole('button', { name: 'VENDER' }).click();
  await assetSelect.selectOption({ label: 'PETR4 (BRASIL)' });
  await quantity.fill('4');
  await page.getByRole('button', { name: 'Confirmar Venda' }).click();
  await expect(page.getByText(/6 cotas/)).toBeVisible();
  await expect(page.getByText(/2 cotas/)).toBeVisible();
  await expect(page.getByText(/1[.,]180[.,]00/)).toBeVisible();

  const exactTotal = await request.get('http://localhost:8080/carteira/saldo-total');
  expect(exactTotal.ok()).toBe(true);
  expect(await exactTotal.text()).toBe('1180.00');

  await quantity.fill('99');
  await page.getByRole('button', { name: 'Confirmar Venda' }).click();
  await expect(page.getByText(/insuficiente/)).toBeVisible();

  await request.post('http://localhost:9090/control/fail-brapi-after-one-success');
  await page.getByRole('button', { name: 'COMPRAR' }).click();
  await quantity.fill('1');
  await page.getByRole('button', { name: 'Confirmar Compra' }).click();
  await expect(page.getByText(/confirmada, mas os dados/)).toBeVisible();

  await page.route('http://localhost:8080/carteira/comprar', async route => {
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    await route.abort('connectionfailed');
  }, { times: 1 });
  await quantity.fill('1');
  await page.getByRole('button', { name: 'Confirmar Compra' }).click();
  await expect(page.getByText(/confirmar o resultado/)).toBeVisible();

  const positions = await request.get('http://localhost:8080/carteira/posicoes');
  expect(positions.ok()).toBe(true);
  const persisted = await positions.json();
  expect(persisted.find((item: any) => item.ticker === 'PETR4').quantidade).toBe(8);
});
