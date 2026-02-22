# CodeBG

CodeBG is a Vite + React + TypeScript project focused on low-maintenance web development.

## Stack

- Vite
- React + TypeScript
- TailwindCSS
- shadcn/ui-style component pattern

## Development

```bash
npm ci
npm run dev
```

## Build

```bash
npm run build
```

## CI deploy

`.github/workflows/deploy-test-ci.yml` runs on push to `test-ci` and builds on the deployment VM.

Required GitHub secrets:
- `VM_HOST`
- `VM_USER`
- `VM_SSH_KEY`
