# Billwise

**Smarter invoice processing.** AI-powered extraction of structured data from Argentine invoices.

**Live demo:** [billwise-mjv.vercel.app](https://billwise-mjv.vercel.app)

> Work in progress.

## Stack

- **Web:** Next.js, TypeScript, Tailwind CSS
- **API:** NestJS, PostgreSQL, BullMQ + Redis
- **Shared:** invoice parsing and validation logic used by both the web app and the API
- **AI:** Gemini (free tier) for photos and scanned PDFs

## Project structure

```
apps/
  web/        Next.js app (landing, demo, review screen, dashboard)
  api/        NestJS API and background worker
packages/
  shared/     Invoice parsing and validation logic shared by web and API
  reader/     Reads invoice PDFs with pdf.js: text with positions and the ARCA QR
  samples/    Generator of fictitious invoices for the demo and tests
```

## Getting started

Requirements: Node.js 24 and Docker.

```bash
npm install
cp .env.example .env
docker compose up -d
npm run dev:api
npm run dev:web
```

The web app runs on http://localhost:3000 and the API on http://localhost:3001.

## Try the reader

Read any invoice PDF from the command line. Everything runs locally; nothing is sent anywhere.

```bash
npm run read -- apps/web/public/samples/invoice-qr-mismatch.pdf --image highlights.png
```

It prints every field with its status (ok, warning or error) and whether it came from the printed text or the ARCA QR. With `--image`, it saves the first page with the fields highlighted.

## Scripts

| Command                      | Description                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run build`              | Build all packages                                                                           |
| `npm run generate:samples`   | Regenerate the sample invoices in `apps/web/public/samples`                                  |
| `npm run precompute:ai`      | Read the sample photo with Gemini once and store the answer in `packages/samples/ai-results` |
| `npm run read -- <file.pdf>` | Read an invoice PDF and print the extracted fields                                           |
| `npm test`                   | Run all tests                                                                                |
| `npm run lint`               | Lint all packages                                                                            |
| `npm run format`             | Format the codebase with Prettier                                                            |

## License

[MIT](LICENSE)
