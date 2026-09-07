const http = require('node:http');

const scenarios = new Map([
  ['brapi', 'success'], ['twelvedata', 'success'], ['bcb', 'success'], ['cvm', 'success']
]);
const requests = [];
let failBrapiAfterSuccesses = null;

const cvmArchive = Buffer.from(
  'UEsDBBQAAAAIANCwJl3rrF6gUAAAAFQAAAAQAAAAY2FkX2ludGVybWVkLmNzdgXBMQ6AIAwAwJ1X8AERCoNJJ1IxwUhLanX1/7/wzuY3q1onJJ4n3t2Q9o/e4UhUm4lWTCkAQMg5rzHGtGwJ2/DHw9SF62hs4ll01AsLFHA/UEsBAhQAFAAAAAgA0LAmXeusXqBQAAAAVAAAABAAAAAAAAAAAAAAAAAAAAAAAGNhZF9pbnRlcm1lZC5jc3ZQSwUGAAAAAAEAAQA+AAAAfgAAAAAA',
  'base64'
);

function json(response, status, value, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  response.end(JSON.stringify(value));
}

function raw(response, status, value, contentType = 'application/json', headers = {}) {
  response.writeHead(status, { 'Content-Type': contentType, ...headers });
  response.end(value);
}

function setScenario(provider, scenario) {
  const allowedProviders = ['brapi', 'twelvedata', 'bcb', 'cvm'];
  const allowedScenarios = ['success', 'stale', 'rate-limit', 'invalid', 'unavailable', 'timeout'];
  if (!allowedScenarios.includes(scenario)) return false;
  const targets = provider === 'all' ? allowedProviders : [provider];
  if (targets.some(value => !allowedProviders.includes(value))) return false;
  for (const target of targets) scenarios.set(target, scenario);
  return true;
}

function record(provider, url) {
  requests.push({ provider, path: url.pathname, queryKeys: [...url.searchParams.keys()].sort(), scenario: scenarios.get(provider) });
}

function controlled(provider, response, url, success) {
  record(provider, url);
  const scenario = scenarios.get(provider);
  if (scenario === 'timeout') return setTimeout(() => json(response, 504, { error: 'controlled timeout' }), 15_000);
  if (scenario === 'rate-limit') return json(response, 429, { error: 'controlled rate limit' });
  if (scenario === 'unavailable') return json(response, 503, { error: 'controlled provider unavailable' });
  if (scenario === 'invalid') return raw(response, 200, '{invalid-json');
  return success(scenario);
}

function bcbDate(daysAgo) {
  const value = new Date(Date.now() - daysAgo * 86_400_000);
  const pad = number => String(number).padStart(2, '0');
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())} 13:00:00.000`;
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost:9090');
  if (url.pathname === '/health') return json(response, 200, { status: 'ok' });
  if (request.method === 'POST' && url.pathname === '/control/reset') {
    setScenario('all', 'success'); requests.length = 0; failBrapiAfterSuccesses = null;
    return json(response, 200, { configured: true });
  }
  if (request.method === 'POST' && url.pathname === '/control/scenario') {
    const configured = setScenario(url.searchParams.get('provider'), url.searchParams.get('scenario'));
    return json(response, configured ? 200 : 400, { configured, scenarios: Object.fromEntries(scenarios) });
  }
  if (url.pathname === '/control/requests') return json(response, 200, { requests });
  if (request.method === 'POST' && url.pathname === '/control/fail-brapi-after-one-success') {
    failBrapiAfterSuccesses = 1;
    return json(response, 200, { configured: true });
  }
  if (url.pathname === '/brapi/api/quote/PETR4') {
    if (failBrapiAfterSuccesses === 0) {
      failBrapiAfterSuccesses = null;
      return json(response, 503, { error: 'controlled provider failure' });
    }
    if (failBrapiAfterSuccesses !== null) failBrapiAfterSuccesses--;
    return controlled('brapi', response, url, scenario => json(response, 200, { results: [{
      regularMarketPrice: 20, currency: 'BRL', regularMarketTime: scenario === 'stale' ? Math.floor(Date.now() / 1000) - 172800 : Math.floor(Date.now() / 1000)
    }] }));
  }
  if (url.pathname === '/twelvedata/price' && url.searchParams.get('symbol') === 'AAPL') {
    return controlled('twelvedata', response, url, scenario => json(response, 200, {
      price: 100, datetime: scenario === 'stale' ? new Date(Date.now() - 172_800_000).toISOString() : new Date().toISOString()
    }));
  }
  if (url.pathname === '/brasilapi/cnpj/v1/11222333000181') {
    return json(response, 200, {
      razao_social: 'Corretora Teste', nome_fantasia: 'Corretora Teste',
      descricao_situacao_cadastral: 'ATIVA', cnae_fiscal: 6612601
    });
  }
  if (url.pathname === '/viacep/01001000/json/') {
    return json(response, 200, {
      cep: '01001-000', logradouro: 'Praça da Sé', bairro: 'Sé',
      localidade: 'São Paulo', uf: 'SP', erro: false
    });
  }
  if (url.pathname.startsWith('/bcb/CotacaoDolarPeriodo')) {
    return controlled('bcb', response, url, scenario => json(response, 200, { value: [{
      cotacaoVenda: 5.25, dataHoraCotacao: bcbDate(scenario === 'stale' ? 5 : 1), tipoBoletim: 'Fechamento PTAX'
    }] }));
  }
  if (url.pathname === '/cvm/cad_intermed.zip') {
    return controlled('cvm', response, url, scenario => raw(response, 200, cvmArchive, 'application/zip', {
      'Last-Modified': new Date(Date.now() - (scenario === 'stale' ? 4 : 1) * 86_400_000).toUTCString()
    }));
  }
  return json(response, 404, { error: 'provider fixture not found' });
});

server.listen(9090, process.env.PROVIDER_STUB_HOST || '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
