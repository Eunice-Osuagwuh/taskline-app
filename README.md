# Taskline

A Vite + React task management web app with a sidebar workspace, task table, and analytics panel.

## Local Run

```bash
npm install
npm run dev
```

The dev server binds to `0.0.0.0` and uses:
- `VITE_PORT` if provided
- otherwise `3000`

## Production

```bash
npm run build
PORT=8080 npm start
```

`npm start` serves the built `dist/` app and binds to `process.env.PORT` with a default of `8080`.

## Docker

Build the image locally:

```bash
docker build --platform linux/amd64 -t your-dockerhub-username/taskline:v1 .
```

Push it to Docker Hub:

```bash
docker push your-dockerhub-username/taskline:v1
```

The Docker image uses a multi-stage build with `node:20-bookworm-slim`. The build stage runs on the native build platform to avoid `esbuild` issues during cross-platform builds, while the final image is compatible with `linux/amd64` deployment targets such as Azure.

## App Env Variables

- `APP_TITLE`: app title in server/runtime mode
- `VITE_APP_TITLE`: app title in local Vite mode
- `PORT`: server port for `npm start`
