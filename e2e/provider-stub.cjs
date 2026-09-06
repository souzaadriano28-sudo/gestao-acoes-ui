const http = require('node:http');

let failBrapiAfterSuccesses = null;

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(value));
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost:9090');
  if (url.pathname === '/health') return json(response, 200, { status: 'ok' });
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
    return json(response, 200, { results: [{ regularMarketPrice: 20, currency: 'BRL' }] });
  }
  if (url.pathname === '/twelvedata/price' && url.searchParams.get('symbol') === 'AAPL') {
    return json(response, 200, { price: 100 });
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
  return json(response, 404, { error: 'provider fixture not found' });
});

server.listen(9090, process.env.PROVIDER_STUB_HOST || '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
