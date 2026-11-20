# Solaris — Solar Business Platform

A responsive solar company website and connected operations workspace with cool-grey surfaces, cobalt-blue navigation, white rounded cards, readable forms, an original solar-home illustration and separate agent/company sign-in pages.

The current dashboard adapts the [supplied Pinterest reference](https://www.pinterest.com/pin/1132022056371365656/): a split blue sidebar, welcome card, vertical project-stage chart, installation progress rings and a right-hand schedule/update column. Charts use role-scoped stored records; progress percentages measure completed installation steps. The original reference image is not redistributed.

## What works

- Public solar solutions, installation process, partner programme and FAQ pages.
- Password/session sign-in and eight server-enforced business roles: administrator, customer, partner, sales, relationship manager, technician, document reviewer and finance.
- Partner applications, private KYC uploads, KYC review and account approval.
- Database-backed enquiries, mobile/email duplicate protection, original partner attribution, sales assignment, call notes and follow-up dates.
- Lead conversion into unique projects with assigned managers, technicians and reviewers.
- Product/kit catalogue and company-controlled prices. Server-calculated quotations with immutable price snapshots, internal approval, customer publishing, acceptance/rejection and browser print/PDF.
- Site surveys, private project documents, document review, bank/DISCOM/net-metering approval tracking.
- Eight installation phases, evidence references, quality results, handover acknowledgement and completion gates.
- Configurable per-kW incentives captured with their rule snapshot, admin approval, finance payout records, failed-payment retry and verified payment evidence.
- Unique payout per incentive and unique payment reference for paid payouts. Paid records cannot be overwritten.
- Customer collection recording with uploaded evidence, support tickets and replies, in-app project notifications, audit history and role-scoped CSV exports.
- Live dashboard totals from stored records. Local demo fixtures are clearly labeled; dashboard totals are calculated from the records visible to the signed-in role.

## Vercel deployment

This project now uses **Next.js on Node 22**, **Turso libSQL** for persistent SQLite data, and a **private Vercel Blob store** for documents. The former Vinext build produced Worker output instead of `.next/routes-manifest.json`; `npm run build` now invokes `next build --webpack`, and `vercel.json` selects the Next.js framework and `.next` output.

1. In Vercel, import `intoxiagmb-crypto/samerika`, branch `main`, with this repository root as the root directory. Use the Next.js preset, `npm run build`, `.next`, and Node 22.x. Remove any old dashboard override pointing to Vinext or `dist`.
2. Create/connect a **Turso libSQL database** and a **private** Vercel Blob store. Set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `BLOB_READ_WRITE_TOKEN` in the Vercel project's Production environment. Use separate database and storage resources for Preview deployments. These are server secrets; never use `NEXT_PUBLIC_` names.
3. Copy `.env.example` to ignored `.env.local` locally and enter the same database credentials securely. Run `npm ci`, then `npm run db:migrate` once against the intended database. Migrations run in a transaction and record checksums; repeat runs skip completed migrations. The build does not modify databases.
4. Run `npm run admin:create` in an interactive local terminal using those database credentials. It prompts for the owner's name, email and a password of at least 12 characters (hidden input). It refuses to create a second bootstrap administrator. There is no public first-visitor administrator registration.
5. Deploy/redeploy the `main` commit. Sign in at `/login/company`. Under **People & partners**, choose **Create account** to add staff, customers and agents. Share credentials privately. **Reset password** revokes all existing sessions for that account. Pending partner accounts can sign in and submit KYC; they cannot create leads until the administrator verifies KYC and activates them.
6. Configure company details, documents, catalogue and incentive rates in the dashboard before using real business records.

The build works without production secrets. Live sign-in and database operations require a migrated Turso database; uploads require a private Blob store. Vercel never falls back to a temporary local database or local uploaded files. No remote resources, credentials, migrations or live deployment are created merely by building or pushing the source.

Server uploads accept PDF, JPEG or PNG up to **4 MB**, leaving room for multipart overhead under Vercel's 4.5 MB function request limit. Files are read through an authenticated endpoint after project/owner permission checks. Blob objects are private; MIME signatures are checked before upload. The UI shows the same size limit.

Existing Cloudflare D1/R2 data is not automatically copied. This migration preserves the SQL schema and role/business rules, but an existing populated database or bucket requires a separate controlled data transfer. Do not point the initial schema migrations at an imported populated database without baselining its migration history. The previous `.openai/hosting.json` identity and legacy build helpers remain archived in the repository; Vercel does not use them or ChatGPT authentication headers.

## Local development

Requires Node 22.13+ (22.x). With remote service variables unset:

```sh
npm ci
npm run demo:setup
npm run dev
```

Open `http://127.0.0.1:5175`. Agent sign-in is `/login/agent`, company sign-in is `/login/company`, and customer sign-in is `/login/customer`.

Local development stores SQLite in ignored `.solaris/local.db` and private files in `.solaris/files`. Demo setup creates three local accounts with distinct random passwords in ignored `.solaris/demo-credentials.json` (owner-only permissions), preserves existing accounts and refuses to run with remote database/storage credentials. It does not create production users or overwrite the old local Cloudflare state.

For an empty local workspace without demo accounts, run `npm run db:migrate`, then `npm run admin:create`.

Passwords use salted scrypt hashes. Sessions use hashed random tokens, HttpOnly and SameSite=Lax cookies (Secure on HTTPS), a 12-hour expiry, rotation at login and revocation on logout/password reset. Suspended users lose access. Sign-in attempts are rate limited in the database. Incoming ChatGPT identity headers are not trusted for authentication.

## Verification

```sh
npm test
npm run build
npm run typecheck
npm run demo:setup
# Start a local production server, then run HTTP checks in a second terminal:
SOLARIS_LOCAL_DATA=1 npm start -- --hostname 127.0.0.1 --port 5175
npm run test:http
```

`SOLARIS_LOCAL_DATA=1` is an explicit local production-test override; it has no effect on Vercel. Never set remote service credentials when running demo or HTTP fixture tests. HTTP tests refuse non-loopback URLs and create local records.

The business lifecycle suite runs against the production libSQL adapter, including atomic batches, quote arithmetic, KYC, cross-account permissions, project completion and payment evidence. Additional tests cover repeatable migrations, rollback, hosted configuration guards, account provisioning, password reset/session revocation and private file storage. HTTP checks cover public/login pages, all three sign-ins, forged identity headers, CSRF, account escalation, lead/project handoff, MIME validation, private downloads and logout.

## Remaining work from the enterprise master brief

This is a working initial implementation, **not a claim that the entire enterprise specification is complete or production-audited**.

- Configurable incentive slabs, brand/partner overrides, bonus campaigns, effective-date rule management and adjustment ledger.
- Payout batches, full double-entry accounting, reconciliation imports, bulk operations and advanced reporting/Excel workbooks.
- Product inventory, bill-of-material kit composition, purchase prices, editable catalogue price versions and a richer quotation revision workflow.
- Fine-grained permission configuration beyond the implemented fixed roles; separate employee onboarding/invites.
- Document malware scanning, retention/backup/restore operations, richer document version linking and expiring signed download links (current downloads go through an authenticated authorization endpoint).
- Phase-level task subchecklists, phase rejection/rework workflows, photo galleries, configurable numbers of phases, customer-visible versus internal update controls beyond the implemented note filtering.
- Email, SMS, WhatsApp and external payment providers; bank/government integrations. Current approval tracking and payment recording are manual. The app does not send provider messages or execute money transfers, and never presents them as successful.
- Custom company policies, brand identity, service coverage, commercial terms and public contact details must be supplied/configured before launch.
- Independent security/load/accessibility review, monitoring and backup exercises.

## Assets and publication

Current artwork: original code-native solar-home SVG in `components/solar-scene.tsx`. The legacy Earth asset is retained but unused. Fonts: DM Sans and Manrope via Google Fonts with system fallbacks. Icons: Lucide.

Design research: [Aurora solar sales workflow](https://docs.aurorasolar.com/reference/common-workflows) informed the enquiry-to-survey-to-quotation flow; [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) and [password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) informed local sign-in and session handling.

GitHub pushes trigger Vercel builds when the repository is connected. Production database migrations and account bootstrap are explicit operator steps, never demo seeding during deployment.
