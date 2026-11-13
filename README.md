# CAD-Agent Website

This repository contains only the CAD-Agent static website preview. It does not include the CAD-Agent desktop application, account Worker, or D1 database. Website sign-in and live CAD/AI connections are not enabled.

## Local development

```sh
npm ci
npm run dev
```

## Deploy to Cloudflare Pages

Connect this GitHub repository to Cloudflare Pages and use:

- Framework preset: **Vite**
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION=22`

The `public/_redirects` file keeps the Product, Demo, Plans, and Integrations routes working on direct visits and page refreshes.

GitHub Actions runs the production build on pushes and pull requests.
