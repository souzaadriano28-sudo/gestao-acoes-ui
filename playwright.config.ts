import { defineConfig } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const containerized = process.env['E2E_CONTAINERIZED'] === 'true';
const uiPort = process.env['E2E_UI_PORT'] ?? '4300';
const backendPort = process.env['E2E_BACKEND_PORT'] ?? '8180';
const providerPort = process.env['E2E_PROVIDER_PORT'] ?? '9190';
const generatedUsername = `atlas-e2e-${randomUUID().slice(0, 8)}`;
const generatedPassword = `Atlas-E2E-${randomUUID()}!`;
process.env['E2E_RUNTIME_ADMIN_USERNAME'] ??= containerized
  ? process.env['E2E_ADMIN_USERNAME']
  : generatedUsername;
process.env['E2E_RUNTIME_ADMIN_PASSWORD'] ??= containerized
  ? process.env['E2E_ADMIN_PASSWORD']
  : generatedPassword;

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  timeout: 90_000,
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? `http://127.0.0.1:${uiPort}`,
    headless: true
  },
  webServer: [
    {
      command: 'node e2e/provider-stub.cjs',
      url: `http://127.0.0.1:${providerPort}/health`,
      timeout: 30_000,
      reuseExistingServer: containerized,
      env: containerized ? { PROVIDER_STUB_HOST: '0.0.0.0', PROVIDER_STUB_PORT: providerPort }
        : { PROVIDER_STUB_PORT: providerPort }
    },
    ...(!containerized ? [{
      command: 'mvn.cmd -q -f ..\\gestao-acoes-spring\\pom.xml -Dspring-boot.run.main-class=com.trabalho.gestao_acoes.e2e.E2eTestLauncher spring-boot:test-run',
      url: `http://localhost:${backendPort}/acoes`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        SPRING_PROFILES_ACTIVE: 'test',
        SERVER_PORT: backendPort,
        APP_CORS_ALLOWED_ORIGIN: `http://127.0.0.1:${uiPort}`,
        INTEGRATIONS_BRAPI_URL: `http://127.0.0.1:${providerPort}/brapi/api`,
        INTEGRATIONS_TWELVEDATA_URL: `http://127.0.0.1:${providerPort}/twelvedata`,
        INTEGRATIONS_BRASILAPI_URL: `http://127.0.0.1:${providerPort}/brasilapi/cnpj/v1`,
        INTEGRATIONS_VIACEP_URL: `http://127.0.0.1:${providerPort}/viacep`,
        INTEGRATIONS_BCB_PTAX_URL: `http://127.0.0.1:${providerPort}/bcb`,
        INTEGRATIONS_CVM_REGISTRY_URL: `http://127.0.0.1:${providerPort}/cvm`,
        ADMIN_INITIAL_USERNAME: process.env['E2E_RUNTIME_ADMIN_USERNAME']!,
        ADMIN_INITIAL_PASSWORD: process.env['E2E_RUNTIME_ADMIN_PASSWORD']!
      }
    }, {
      command: `npm run start -- --host 127.0.0.1 --port ${uiPort} --proxy-config proxy.e2e.conf.json`,
      url: `http://127.0.0.1:${uiPort}`,
      timeout: 120_000,
      reuseExistingServer: false
    }] : [])
  ]
});
