import { defineConfig } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const containerized = process.env['E2E_CONTAINERIZED'] === 'true';
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
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://127.0.0.1:4200',
    headless: true
  },
  webServer: [
    {
      command: 'node e2e/provider-stub.cjs',
      url: 'http://127.0.0.1:9090/health',
      timeout: 30_000,
      reuseExistingServer: containerized,
      env: containerized ? { PROVIDER_STUB_HOST: '0.0.0.0' } : undefined
    },
    ...(!containerized ? [{
      command: 'mvn.cmd -q -f ..\\gestao-acoes-spring\\pom.xml spring-boot:run',
      url: 'http://localhost:8080/acoes',
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        SPRING_PROFILES_ACTIVE: 'test',
        APP_CORS_ALLOWED_ORIGIN: 'http://127.0.0.1:4200',
        INTEGRATIONS_BRAPI_URL: 'http://127.0.0.1:9090/brapi/api',
        INTEGRATIONS_TWELVEDATA_URL: 'http://127.0.0.1:9090/twelvedata',
        INTEGRATIONS_BRASILAPI_URL: 'http://127.0.0.1:9090/brasilapi/cnpj/v1',
        INTEGRATIONS_VIACEP_URL: 'http://127.0.0.1:9090/viacep',
        ADMIN_INITIAL_USERNAME: process.env['E2E_RUNTIME_ADMIN_USERNAME']!,
        ADMIN_INITIAL_PASSWORD: process.env['E2E_RUNTIME_ADMIN_PASSWORD']!
      }
    }, {
      command: 'npm run start -- --host 127.0.0.1 --port 4200',
      url: 'http://127.0.0.1:4200',
      timeout: 120_000,
      reuseExistingServer: false
    }] : [])
  ]
});
