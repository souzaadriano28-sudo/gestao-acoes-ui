import { expect, Page, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const username = process.env['E2E_RUNTIME_ADMIN_USERNAME'] ?? process.env['E2E_ADMIN_USERNAME'];
const password = process.env['E2E_RUNTIME_ADMIN_PASSWORD'] ?? process.env['E2E_ADMIN_PASSWORD'];
const screenshotDir = process.env['E2E_SCREENSHOT_DIR'];
const providerBase = process.env['E2E_PROVIDER_CONTROL_URL'] ?? 'http://127.0.0.1:9090';

async function providerScenario(page: Page, provider: string, scenario: string): Promise<void> {
  const response = await page.request.post(`${providerBase}/control/scenario?provider=${provider}&scenario=${scenario}`);
  expect(response.ok(), `configurar ${provider}/${scenario}`).toBe(true);
}

async function login(page: Page, returnUrl = '/dashboard'): Promise<void> {
  if (!username || !password) throw new Error('E2E admin credentials must be supplied only through the runtime environment');
  await page.goto(returnUrl); await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Usuário').fill(username); await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar com segurança' }).click(); await expect(page).toHaveURL(new RegExp(returnUrl));
}

async function audit(page: Page, name: string, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height }); await page.waitForTimeout(80);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${name} ${width}px sem overflow`).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations, `${name} ${width}px axe`).toEqual([]);
  if (screenshotDir) await page.screenshot({ path: `${screenshotDir}/${name}-${width}x${height}.png`, fullPage: true });
}

async function registerOperation(page: Page, type: 'COMPRA' | 'VENDA', asset: string, quantity: string): Promise<void> {
  await page.getByLabel(type === 'COMPRA' ? 'Compra simulada' : 'Venda simulada').check();
  await page.locator('#operation-asset').selectOption({ label: asset }); await page.locator('#operation-broker').selectOption({ label: 'Corretora Teste' });
  await page.getByLabel('Quantidade inteira').fill(quantity); await page.getByRole('button', { name: new RegExp(`Revisar ${type === 'COMPRA' ? 'compra' : 'venda'}`, 'i') }).click();
  await expect(page.getByRole('heading', { name: 'Revise antes de confirmar' })).toBeVisible();
  const response = page.waitForResponse(item => item.url().includes(`/api/carteira/${type === 'COMPRA' ? 'comprar' : 'vender'}`));
  await page.getByRole('button', { name: 'Confirmar registro simulado' }).dblclick();
  expect((await response).status()).toBe(200); await expect(page.getByText('Registro simulado concluído e leituras confirmadas pelo backend.')).toBeVisible();
}

test('provedores simulados oferecem matriz controlada sem credenciais ou rede financeira real', async ({ page }) => {
  await page.request.post(`${providerBase}/control/reset`);
  const cases = [
    { provider: 'brapi', url: `${providerBase}/brapi/api/quote/PETR4?token=redacted-test-value` },
    { provider: 'twelvedata', url: `${providerBase}/twelvedata/price?symbol=AAPL&apikey=redacted-test-value` },
    { provider: 'bcb', url: `${providerBase}/bcb/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?$format=json` },
    { provider: 'cvm', url: `${providerBase}/cvm/cad_intermed.zip` }
  ];
  for (const item of cases) {
    for (const scenario of ['success', 'stale', 'rate-limit', 'invalid', 'unavailable']) {
      await providerScenario(page, item.provider, scenario);
      const response = await page.request.get(item.url);
      expect(response.status()).toBe(scenario === 'rate-limit' ? 429 : scenario === 'unavailable' ? 503 : 200);
      if (scenario === 'invalid') expect(await response.text()).toBe('{invalid-json');
    }
  }
  const log = await (await page.request.get(`${providerBase}/control/requests`)).json();
  expect(log.requests).toHaveLength(cases.length * 5);
  expect(JSON.stringify(log)).not.toContain('redacted-test-value');
  expect(new Set(log.requests.map((item: { provider: string }) => item.provider))).toEqual(new Set(cases.map(item => item.provider)));
  await page.request.post(`${providerBase}/control/reset`);
});

test('jornada real autenticada e responsiva do Atlas Carteira', async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 1024 }); await login(page);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nenhuma posição ativa' })).toBeVisible();
  await expect(page.getByText('Dados parciais')).toHaveCount(0);
  await audit(page, 'dashboard-empty', 1440, 1024);
  await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();

  await page.goto('/corretoras'); await page.getByLabel('CNPJ').fill('11.222.333/0001-81'); await page.getByLabel('CEP').fill('01001000');
  const brokerRequest = page.waitForRequest(request => new URL(request.url()).pathname === '/api/corretoras' && request.method() === 'POST');
  await page.getByRole('button', { name: 'Cadastrar corretora' }).click(); expect((await brokerRequest).headers()['x-csrf-token']).toBeTruthy(); await expect(page.getByText('Corretora Teste').first()).toBeVisible();

  await page.goto('/acoes'); await page.getByLabel('Ticker').fill('PETR4'); await page.getByLabel('Mercado').selectOption('BRASIL'); await page.getByRole('button', { name: 'Cadastrar ativo' }).click(); await expect(page.getByRole('rowheader', { name: /PETR4/ })).toBeVisible();
  await page.getByLabel('Ticker').fill('AAPL'); await page.getByLabel('Mercado').selectOption('AMERICANO'); await page.getByRole('button', { name: 'Cadastrar ativo' }).click(); await expect(page.getByRole('rowheader', { name: /AAPL/ })).toBeVisible();

  await page.goto('/carteira'); await expect(page.getByText('Nenhuma posição encontrada')).toBeVisible(); await audit(page, 'carteira-empty', 1440, 1024);
  await page.goto('/operacoes'); await registerOperation(page, 'COMPRA', 'PETR4 · BRASIL', '10'); await registerOperation(page, 'COMPRA', 'PETR4 · BRASIL', '5'); await registerOperation(page, 'COMPRA', 'AAPL · AMERICANO', '2');
  await page.goto('/carteira'); await expect(page.getByRole('rowheader', { name: /PETR4/ })).toBeVisible(); await expect(page.getByRole('rowheader', { name: /AAPL/ })).toBeVisible();
  await page.goto('/operacoes'); await registerOperation(page, 'VENDA', 'PETR4 · BRASIL', '4');
  await page.goto('/carteira');
  const partialSalePosition = page.getByRole('rowheader', { name: /PETR4/ }).locator('..');
  await expect(partialSalePosition).toContainText('11'); await expect(partialSalePosition).toContainText('R$ 20,00');
  await page.goto('/operacoes'); await registerOperation(page, 'VENDA', 'PETR4 · BRASIL', '11');
  await page.goto('/carteira'); await expect(page.getByRole('rowheader', { name: /PETR4/ })).toHaveCount(0); await expect(page.getByRole('rowheader', { name: /AAPL/ })).toBeVisible();
  await page.goto('/operacoes'); await expect(page.getByRole('row', { name: /Venda simulada PETR4/ }).first()).toBeVisible();
  const history = await page.request.get('/api/carteira/movimentacoes?size=20'); expect(history.ok()).toBe(true); expect((await history.json()).items).toHaveLength(5);
  await page.goto('/dashboard');
  await expect(page.getByText('R$ 1.050,00').first()).toBeVisible();
  await expect(page.getByText('TWELVE_DATA')).toBeVisible();
  await expect(page.getByText('BANCO_CENTRAL_DO_BRASIL_PTAX')).toBeVisible();

  const routes = ['dashboard', 'carteira', 'acoes', 'corretoras', 'operacoes'];
  const viewports = [{ width: 1440, height: 1024 }, { width: 768, height: 1024 }, { width: 720, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }];
  for (const route of routes) { await page.goto(`/${route}`); await expect(page.locator('h1')).toBeVisible(); for (const viewport of viewports) await audit(page, route, viewport.width, viewport.height); }
  await page.goto('/rota-inexistente'); await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible(); await audit(page, '404', 320, 568);

  await page.goto('/dashboard'); await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible(); await context.clearCookies();
  await page.getByRole('button', { name: 'Atualizar dados' }).click(); await expect(page).toHaveURL(/\/login/); await expect(page.getByText('Sua sessão expirou. Entre novamente para continuar.')).toBeVisible();
  await login(page);
  const logoutResponse = page.waitForResponse(response => response.request().method() === 'POST'
    && new URL(response.url()).pathname === '/api/auth/logout');
  await page.getByRole('button', { name: 'Sair' }).click();
  expect((await logoutResponse).status()).toBe(204);
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});

test('jornada móvel preserva navegação, cartões, operação e conteúdo em 390 e 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await login(page);
  await expect(page.getByRole('navigation', { name: 'Navegação principal móvel' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navegação principal móvel' }).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
  for (const width of [390, 320]) {
    const height = width === 390 ? 844 : 568;
    for (const route of ['dashboard', 'carteira', 'acoes', 'corretoras', 'operacoes']) {
      await page.goto(`/${route}`); await audit(page, `mobile-${route}`, width, height);
      await expect(page.locator('main')).toBeVisible();
      if (route !== 'dashboard') await expect(page.locator('.mobile-data-card').first()).toBeVisible();
    }
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/operacoes');
  const before = await (await page.request.get('/api/carteira/movimentacoes?size=100')).json();
  await registerOperation(page, 'COMPRA', 'AAPL · AMERICANO', '1');
  const after = await (await page.request.get('/api/carteira/movimentacoes?size=100')).json();
  expect(after.totalElements).toBe(before.totalElements + 1);
  await expect(page.locator('.mobile-data-card').filter({ hasText: 'AAPL' }).first()).toBeVisible();
  await audit(page, 'mobile-operation-confirmed', 390, 844);
});

test('estados parcial e stale preservam dados confirmados', async ({ page }) => {
  await page.route('**/api/carteira/dashboard', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(partialDashboardFixture) }), { times: 1 });
  await login(page); await expect(page.getByText(/nenhum total parcial/i)).toBeVisible(); await expect(page.getByText('Indisponível').first()).toBeVisible(); await expect(page.getByText('AAPL').first()).toBeVisible(); await audit(page, 'dashboard-parcial', 390, 844);
  await page.route('**/api/carteira/dashboard', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Falha sintética de leitura' }) }), { times: 1 });
  await page.getByRole('button', { name: 'Atualizar dados' }).click(); await expect(page.getByText('Falha sintética de leitura')).toBeVisible(); await expect(page.locator('.mobile-data-card').getByText('AAPL').first()).toBeVisible();
  await audit(page, 'dashboard-stale', 390, 844);

});

test('409 e resultado desconhecido exigem reconciliação sem reenviar a mutação', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await login(page, '/operacoes');
  const prepare = async (): Promise<void> => {
    await page.locator('#operation-asset').selectOption({ label: 'AAPL · AMERICANO' });
    await page.locator('#operation-broker').selectOption({ label: 'Corretora Teste' });
    await page.getByLabel('Quantidade inteira').fill('1');
    await page.getByRole('button', { name: 'Revisar compra simulada' }).click();
  };

  let conflictRequests = 0;
  const countConflict = (request: import('@playwright/test').Request): void => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/carteira/comprar') conflictRequests++;
  };
  page.on('request', countConflict);
  await page.setExtraHTTPHeaders({ 'X-Atlas-E2E-Fault': 'conflict' });
  await prepare();
  const conflictResponse = page.waitForResponse(response => response.request().method() === 'POST'
    && new URL(response.url()).pathname === '/api/carteira/comprar');
  await page.getByRole('button', { name: 'Confirmar registro simulado' }).click();
  const receivedConflict = await conflictResponse;
  expect(receivedConflict.status()).toBe(409);
  await receivedConflict.finished();
  expect((await receivedConflict.json()).code).toBe('CONCURRENT_OPERATION');
  await expect(page.getByText(/Outra operação alterou/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Reconciliar sem reenviar' }).click();
  await expect(page.getByText(/Leituras reconciliadas/)).toBeVisible();
  expect(conflictRequests).toBe(1);
  page.off('request', countConflict);
  await page.setExtraHTTPHeaders({});

  const beforeUnknown = await (await page.request.get('/api/carteira/movimentacoes?size=100')).json();
  let unknownRequests = 0;
  await page.route('**/api/carteira/comprar', async route => {
    unknownRequests++;
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    await route.abort('connectionfailed');
  });
  await prepare(); await page.getByRole('button', { name: 'Confirmar registro simulado' }).click();
  await expect(page.getByText(/não confirmou nem recusou/)).toBeVisible();
  await page.getByRole('button', { name: 'Reconciliar sem reenviar' }).click();
  await expect(page.getByText(/Leituras reconciliadas/)).toBeVisible();
  const afterUnknown = await (await page.request.get('/api/carteira/movimentacoes?size=100')).json();
  expect(unknownRequests).toBe(1);
  expect(afterUnknown.totalElements).toBe(beforeUnknown.totalElements + 1);
  await page.unroute('**/api/carteira/comprar');
});

test('navegação, filtros, atualização e revisão funcionam somente por teclado', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 }); await login(page);
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' });
  await expect(skipLink).toBeFocused(); await page.keyboard.press('Enter'); await expect(page.locator('#conteudo')).toBeFocused();

  const actionsLink = page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Ações', exact: true });
  await actionsLink.focus();
  expect(await actionsLink.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/acoes$/);
  const updateQuote = page.getByRole('button', { name: 'Atualizar cotação' }).first();
  await updateQuote.focus(); await page.keyboard.press('Enter'); await expect(page.getByText('Cotação atualizada e relida do backend.')).toBeVisible();

  await page.goto('/carteira');
  const search = page.getByLabel('Buscar ativo ou corretora'); await search.focus(); await page.keyboard.type('AAPL');
  const apply = page.getByRole('button', { name: 'Aplicar' }); await apply.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('rowheader', { name: /AAPL/ })).toBeVisible();

  await page.goto('/operacoes');
  await page.locator('#operation-asset').selectOption({ label: 'AAPL · AMERICANO' });
  await page.locator('#operation-broker').selectOption({ label: 'Corretora Teste' });
  const quantity = page.getByLabel('Quantidade inteira'); await quantity.focus(); await page.keyboard.type('1');
  const review = page.getByRole('button', { name: 'Revisar compra simulada' }); await review.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Revise antes de confirmar' })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  const edit = page.getByRole('button', { name: 'Voltar e editar' }); await edit.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Revisar compra simulada' })).toBeVisible();

  const nextPage = page.getByRole('button', { name: 'Próxima' });
  await expect(nextPage).toBeDisabled();
  await page.getByRole('button', { name: 'Atualizar histórico' }).focus(); await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('BODY');
});

test('erros, zoom, espaçamento de texto, alvos e cores forçadas mantêm reflow acessível', async ({ page }) => {
  await page.route('**/api/carteira/dashboard', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Dashboard sinteticamente indisponível' }) }), { times: 1 });
  await login(page); await expect(page.getByRole('alert')).toBeVisible(); await audit(page, 'dashboard-error', 390, 844);
  await page.route('**/api/carteira/posicoes/detalhadas**', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Carteira sinteticamente indisponível' }) }), { times: 1 });
  await page.goto('/carteira'); await expect(page.getByRole('alert')).toBeVisible(); await audit(page, 'carteira-error', 390, 844);
  await page.route('**/api/carteira/posicoes/detalhadas**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: partialDashboardFixture.positions, page: 0, size: 20, totalElements: 1, totalPages: 1 }) }), { times: 1 });
  await page.goto('/carteira'); await expect(page.locator('.mobile-data-card').getByText('Indisponível').first()).toBeVisible(); await audit(page, 'carteira-partial', 390, 844);
  await page.route('**/api/carteira/posicoes/detalhadas**', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Falha sintética preservando posições' }) }), { times: 1 });
  await page.getByRole('button', { name: 'Atualizar posições' }).click(); await expect(page.getByText('Falha sintética preservando posições')).toBeVisible(); await audit(page, 'carteira-stale', 390, 844);

  await page.goto('/dashboard');
  const viewports = [{ width: 1440, height: 1024 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 568 }];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; }); await page.waitForTimeout(60);
    const zoomLayout = await page.evaluate(() => ({ fits: document.documentElement.scrollWidth <= document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, offenders: [...document.querySelectorAll<HTMLElement>('body *')].filter(element => { const box = element.getBoundingClientRect(); return box.right > document.documentElement.clientWidth + 1; }).sort((left, right) => right.getBoundingClientRect().right - left.getBoundingClientRect().right).slice(0, 12).map(element => ({ tag: element.tagName, className: element.className, text: element.textContent?.trim().slice(0, 80), left: element.getBoundingClientRect().left, width: element.getBoundingClientRect().width, right: element.getBoundingClientRect().right })) }));
    expect(zoomLayout.fits, `zoom 200% em ${viewport.width}px: ${JSON.stringify(zoomLayout)}`).toBe(true);
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  }
  const spacing = await page.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}' });
  for (const viewport of viewports) {
    await page.setViewportSize(viewport); await page.waitForTimeout(60);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `text spacing em ${viewport.width}px`).toBe(true);
  }
  await spacing.evaluate(element => element.remove());

  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  const smallTargets = await page.locator('a:visible,button:visible,input:visible,select:visible').evaluateAll(elements => elements.filter(element => { const box = element.getBoundingClientRect(); return box.width < 24 || box.height < 24; }).map(element => ({ tag: element.tagName, text: element.textContent?.trim(), box: element.getBoundingClientRect().toJSON() })));
  expect(smallTargets).toEqual([]);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'reduce' });
});

const partialDashboardFixture = {
  asOf: '2026-09-06T15:00:00Z', presentationCurrency: 'BRL', positionCount: 1,
  patrimony: { availability: 'UNAVAILABLE', value: null, currency: 'BRL', reason: 'EXCHANGE_RATE_UNAVAILABLE' },
  cost: { availability: 'AVAILABLE', value: 1050, currency: 'BRL', reason: null },
  unrealizedResult: { availability: 'UNAVAILABLE', value: null, currency: 'BRL', reason: 'EXCHANGE_RATE_UNAVAILABLE' },
  unrealizedResultPercentage: { availability: 'UNAVAILABLE', value: null, reason: 'EXCHANGE_RATE_UNAVAILABLE' },
  positions: [{ positionId: 2, assetId: 2, ticker: 'AAPL', market: 'AMERICANO', brokerId: 1, brokerName: 'Corretora sintética', quantity: 2, nativeCurrency: 'USD', averagePrice: { availability: 'AVAILABLE', value: 100, currency: 'USD', reason: null }, cost: { availability: 'AVAILABLE', value: 200, currency: 'USD', reason: null }, currentQuote: { availability: 'UNAVAILABLE', value: null, currency: 'USD', reason: 'QUOTE_UNAVAILABLE' }, marketValue: { availability: 'UNAVAILABLE', value: null, currency: 'USD', reason: 'QUOTE_UNAVAILABLE' }, unrealizedResult: { availability: 'UNAVAILABLE', value: null, currency: 'USD', reason: 'QUOTE_UNAVAILABLE' }, quoteProvenance: { availability: 'UNAVAILABLE', sourceType: null, provider: null, referenceAt: null, fetchedAt: null, referenceKind: null, currency: 'USD', reason: 'QUOTE_UNAVAILABLE' } }],
  recentMovements: [], quoteSources: [], exchangeSource: { availability: 'UNAVAILABLE', baseCurrency: 'USD', quoteCurrency: 'BRL', rate: null, sourceType: null, provider: null, referenceAt: null, fetchedAt: null, referenceKind: null, reason: 'EXCHANGE_RATE_UNAVAILABLE' }
};
