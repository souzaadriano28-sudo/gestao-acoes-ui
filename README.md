# GestaoAcoesUi

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.13.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

Browser calls use the relative `/api` prefix. `proxy.conf.json` removes that prefix and forwards to the local backend on `127.0.0.1:8080`, matching the browser contract used by the containerized Nginx runtime.

## Container runtime

The multi-stage `Dockerfile` builds Angular with Node and copies only production browser assets into unprivileged Nginx. Nginx listens on port 8080, serves `/health`, falls back to `index.html` for client-side routes, and proxies `/api/*` to the `backend` Compose service. Build and run the complete three-service environment from the parent integration repository with `docker compose up -d --build` after supplying the required secrets outside Git.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
