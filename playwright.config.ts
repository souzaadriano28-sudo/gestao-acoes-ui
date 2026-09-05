import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:4200',
    channel: 'chrome',
    headless: true
  },
  webServer: [
    {
      command: 'node e2e/provider-stub.cjs',
      url: 'http://localhost:9090/health',
      timeout: 30_000,
      reuseExistingServer: false
    },
    {
      command: '..\\gestao-acoes-spring\\mvnw.cmd -q -f ..\\gestao-acoes-spring\\pom.xml spring-boot:run',
      url: 'http://localhost:8080/acoes',
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        SPRING_PROFILES_ACTIVE: 'test',
        INTEGRATIONS_BRAPI_URL: 'http://localhost:9090/brapi/api',
        INTEGRATIONS_TWELVEDATA_URL: 'http://localhost:9090/twelvedata',
        INTEGRATIONS_BRASILAPI_URL: 'http://localhost:9090/brasilapi/cnpj/v1',
        INTEGRATIONS_VIACEP_URL: 'http://localhost:9090/viacep'
      }
    },
    {
      command: 'npm run start -- --host localhost --port 4200',
      url: 'http://localhost:4200',
      timeout: 120_000,
      reuseExistingServer: false
    }
  ]
});
