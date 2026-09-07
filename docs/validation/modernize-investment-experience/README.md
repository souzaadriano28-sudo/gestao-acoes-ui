# Evidência final local — Atlas Carteira

Data da execução: 6 de setembro de 2026 (`America/Sao_Paulo`).

Esta evidência usa somente provedores simulados e dados acadêmicos criados pela própria jornada E2E. Nenhuma chamada foi feita à rede financeira real. Nenhum valor demonstrativo deste ensaio é empacotado no bundle de produção.

## Baseline e autenticação

A predecessora `add-secure-admin-authentication` está integrada nos três repositórios pelos commits `202639a` (especificações), `5e33227` (backend) e `8f6894b` (frontend). A jornada final comprovou:

- redirecionamento de rota protegida e login administrativo;
- cookie de sessão `HttpOnly`, renovação de sessão e expiração;
- token CSRF presente em mutações same-origin;
- logout `POST` com resposta 204, invalidação da sessão e nova proteção de `/dashboard`;
- ausência de credenciais em URL, storage do navegador, imagens e histórico de camadas.

## Contratos exercitados

Os schemas formais e exemplos canônicos permanecem em `gestao-acoes-spring/docs/contracts/portfolio-read-model.schema.json` e `gestao-acoes-spring/docs/portfolio-read-model.md`. O E2E consumiu sem adaptação local:

- `GET /carteira/dashboard`;
- `GET /carteira/posicoes/detalhadas`;
- `GET /carteira/movimentacoes` com paginação e filtros;
- `POST /carteira/comprar` e `POST /carteira/vender`;
- endpoints existentes de ações, corretoras e autenticação.

Exemplo sem valor inventado para métrica indisponível:

```json
{
  "availability": "UNAVAILABLE",
  "value": null,
  "currency": "BRL",
  "reason": "EXCHANGE_RATE_UNAVAILABLE"
}
```

Exemplo do conflito controlado emitido exclusivamente pelo launcher de teste:

```json
{
  "status": 409,
  "code": "CONCURRENT_OPERATION",
  "message": "Conflito concorrente controlado para E2E.",
  "fieldErrors": []
}
```

O cliente não apresenta sucesso para esse conflito. Em falha sem resposta conclusiva, apresenta resultado desconhecido e a ação de recuperação relê dashboard, posições e histórico sem reenviar a mutação.

## Provedores controlados

O stub oferece `success`, `stale`, `rate-limit`, `invalid`, `unavailable` e `timeout` para cotações Brapi/Twelve Data, PTAX BCB e evidência CVM. A matriz automatizada exercitou os cinco primeiros estados nos quatro provedores, contou 20 requisições e confirmou que valores de token não aparecem no log do stub. BCB e CVM são acessados pelos containers em `host.docker.internal`; o processo simulado fica no host e não cria um quarto container.

## Pilha containerizada

O Compose criou exatamente:

1. `postgres` — `postgres:17.6-alpine3.22` fixado por digest;
2. `backend` — Spring Boot, usuário não-root `10001:10001`;
3. `frontend` — Angular/Nginx, usuário não-root `101`.

Os três healthchecks chegaram a `healthy`. `GET /health` e `GET /api/actuator/health/readiness` pelo Nginx retornaram 200. O banco vazio aplicou 9 changesets Liquibase. Após a jornada, o reinício isolado do backend preservou exatamente 6 movimentações, 1 posição e 1 snapshot cambial.

O ensaio PostgreSQL encontrou e corrigiu duas incompatibilidades que H2 não revelava: tipo de parâmetros temporais nulos na consulta paginada e gravação do snapshot cambial dentro de uma transação marcada como somente leitura.

## Comandos e resultados

| Verificação | Resultado |
| --- | --- |
| `npm.cmd test -- --watch=false` | 22 arquivos, 81/81 testes |
| `npm.cmd run build` | sucesso, bundle inicial 424,99 kB |
| `npm.cmd audit --audit-level=high` | 0 vulnerabilidades |
| `npm.cmd run e2e` | 7/7; inclui 409 e resultado desconhecido no backend de teste |
| Playwright contra `http://127.0.0.1:4210` | 6/6; desktop/mobile através de Nginx `/api` |
| Axe WCAG A/AA por rota/estado | 0 violações detectáveis |
| `mvnw.cmd -q verify` | sucesso; H2, PostgreSQL, segurança, concorrência e migrações |
| `validate-isolated-e2e.ps1` | configuração isolada válida |
| `git diff --check` nos três repositórios | sucesso |

A validação OpenSpec estrita foi repetida depois da confirmação humana indicada no checklist de acessibilidade.

## Evidência visual

O diretório `screenshots/` contém 45 capturas geradas na pilha real. Elas cobrem todas as rotas, 404, vazio, erro, parcial, stale e operação confirmada em 1440, 768, 720, 390 e 320 CSS px. Todas as capturas de rotas principais exibem o aviso de sistema acadêmico; os dados visíveis são identificados como registros simulados. Axe e a asserção `scrollWidth <= clientWidth` foram executados antes de cada captura.

O [checklist de acessibilidade](accessibility-checklist.md) separa evidência automatizada da confirmação humana aprovada com Narrador. Uma revisão estética e de experiência posterior permanece registrada como refinamento não bloqueante.
