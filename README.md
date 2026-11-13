# Solaris — Solar Business Platform

A responsive solar company website and connected operations workspace, visually inspired by the supplied Pinterest reference: deep navy, soft cyan, serif display typography and a large Earth image.

## What works

- Public solar solutions, installation process, partner programme and FAQ pages.
- Platform-managed sign-in and eight server-enforced business roles: administrator, customer, partner, sales, relationship manager, technician, document reviewer and finance.
- Partner applications, private KYC uploads, KYC review and account approval.
- Database-backed enquiries, mobile/email duplicate protection, original partner attribution, sales assignment, call notes and follow-up dates.
- Lead conversion into unique projects with assigned managers, technicians and reviewers.
- Product/kit catalogue and company-controlled prices. Server-calculated quotations with immutable price snapshots, internal approval, customer publishing, acceptance/rejection and browser print/PDF.
- Site surveys, private project documents, document review, bank/DISCOM/net-metering approval tracking.
- Eight installation phases, evidence references, quality results, handover acknowledgement and completion gates.
- Configurable per-kW incentives captured with their rule snapshot, admin approval, finance payout records, failed-payment retry and verified payment evidence.
- Unique payout per incentive and unique payment reference for paid payouts. Paid records cannot be overwritten.
- Customer collection recording with uploaded evidence, support tickets and replies, in-app project notifications, audit history and role-scoped CSV exports.
- Live dashboard totals from stored records. There are no fabricated production metrics or seeded business records.

## Stack and storage

React 19, TypeScript, Next-compatible Vinext, Vite, Lucide, Zod, Drizzle schema/migrations, Cloudflare D1 and private R2 storage. This implementation uses the supported Sites Worker deployment environment; it does **not** use the suggested PostgreSQL/Prisma stack. Server business rules are centralized in `lib/business.mjs`. API routes adapt authenticated requests to that service.

D1 contains users, leads, projects, typed operational records, payment-reference reservations, settings, notifications, rate limits and audit events. Operational documents such as survey reports and quotation snapshots have validated extensible JSON payloads. It is not the fully decomposed 40-entity schema described in the master brief.

Authentication is provided by Sites/ChatGPT sign-in, rather than a custom password/OTP implementation. Sites supplies the authenticated identity headers; a direct deployment of the Worker without that trusted gateway is unsupported.

## First use

1. Open the private published site and choose **Open portal**. The first authenticated visitor initializes the administrator account. New Sites are owner-private; **finish this bootstrap before changing the site audience**.
2. Configure company details, contact details, tax, required documents and the incentive rate in **Settings**. Defaults of zero do not represent a commercial offer.
3. Add approved kits and prices in **Products & kits**.
4. Other users sign in as customers. A customer can apply through **Become a partner**. They upload the administrator-requested business verification document; the admin reviews it in **People & partners**, then activates the partner.
5. Assign staff roles in **People & partners** and assign leads/projects to the appropriate people. Staff cannot self-assign a privileged role.
6. Follow the enquiry → survey → quotation → documents → approvals → installation → quality → handover → completion workflow. Configure required approval types on the project; finance projects retain bank approval.
7. Calculate and approve the eligible incentive. Finance creates a payout and records payment evidence and a reference after an actual external payment has been verified.

Changing Site sharing is a separate explicit action. This repository does not broaden the private site's audience. Customers and partners must be allowed by Site access policy before they can sign in.

## Local development

Requires Node 22.13+ (tested on 22.15) and npm.

```sh
npm ci
npm run build
```

Apply each `drizzle/*.sql` migration once, in order, to the local database. For example:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mysterious_rick_jones.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_powerful_vampiro.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_abnormal_bushwacker.sql
npm run dev -- --host 127.0.0.1 --port 5186
```

The maintained development plugin provides one loopback-only local test identity through its sign-in route. That mock is absent in production. Local D1/R2 data is ignored by Git and never included in deployment archives.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

Fourteen service/database tests use real SQLite transactions and the same business service as the deployed APIs. They cover the complete multi-role referral-to-payout lifecycle, KYC, cross-account access denial, duplicate leads/incentives/payouts, quote arithmetic and snapshots, failed inspection, rejected documents, project cancellation/delay, stale writes, cash/finance rules, payment evidence, rate limiting and file permissions.

With the local server running:

```sh
node tests/http-smoke.mjs
```

This intentionally creates local-only fixtures. It verifies the public page response, sign-in, unauthenticated access, CSRF rejection, real lead/project persistence, private R2 upload/download and malformed JSON errors. It refuses non-local targets.

Browser visual and interaction QA could not be executed in this session because the browser automation host was unavailable. Responsive layouts, reduced motion, keyboard dialog handling, empty/error/loading states and print styles are implemented, but should be visually reviewed before a commercial launch.

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

Earth imagery: NASA/JPL, image `PIA18033`, obtained from https://images-assets.nasa.gov/image/PIA18033/PIA18033~orig.jpg and resized to WebP. The Pinterest screenshot is a design reference only and is not redistributed. Fonts: DM Sans and Manrope via Google Fonts with system fallbacks. Icons: Lucide.

`.openai/hosting.json` binds this source to its existing private Site, D1 and R2. Keep that project ID when making future edits. Publish through the Sites source/build/version workflow. All hosted database migrations are applied by Sites; do not run local test fixtures against production.
