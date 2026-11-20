# Solaris — Solar Business Platform

A responsive solar company website and connected operations workspace with cool-grey surfaces, cobalt-blue navigation, white rounded cards, readable forms, an original solar-home illustration and separate agent/company sign-in pages.

The current dashboard adapts the [supplied Pinterest reference](https://www.pinterest.com/pin/1132022056371365656/): a split blue sidebar, welcome card, vertical project-stage chart, installation progress rings and a right-hand schedule/update column. Charts use role-scoped stored records; progress percentages measure completed installation steps. The original reference image is not redistributed.

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
- Live dashboard totals from stored records. Local demo fixtures are clearly labeled; dashboard totals are calculated from the records visible to the signed-in role.

## Stack and storage

React 19, TypeScript, Next-compatible Vinext, Vite, Lucide, Zod, Drizzle schema/migrations, Cloudflare D1 and private R2 storage. This implementation uses the supported Sites Worker deployment environment; it does **not** use the suggested PostgreSQL/Prisma stack. Server business rules are centralized in `lib/business.mjs`. API routes adapt authenticated requests to that service.

D1 contains users, leads, projects, typed operational records, payment-reference reservations, settings, notifications, rate limits and audit events. Operational documents such as survey reports and quotation snapshots have validated extensible JSON payloads. It is not the fully decomposed 40-entity schema described in the master brief.

Hosted authentication is provided by Sites/ChatGPT sign-in. Portable development uses the explicit local credential/session flow described below. The local flow is disabled in production builds. Sites supplies hosted identity headers; a direct deployment without that trusted gateway remains unsupported.

## First use

1. Open the private published site and choose **Open portal**. The first authenticated visitor initializes the administrator account. New Sites are owner-private; **finish this bootstrap before changing the site audience**.
2. Configure company details, contact details, tax, required documents and the incentive rate in **Settings**. Defaults of zero do not represent a commercial offer.
3. Add approved kits and prices in **Products & kits**.
4. Other users sign in as customers. A customer can apply through **Become a partner**. They upload the administrator-requested business verification document; the admin reviews it in **People & partners**, then activates the partner.
5. Assign staff roles in **People & partners** and assign leads/projects to the appropriate people. Staff cannot self-assign a privileged role.
6. Follow the enquiry → survey → quotation → documents → approvals → installation → quality → handover → completion workflow. Configure required approval types on the project; finance projects retain bank approval.
7. Calculate and approve the eligible incentive. Finance creates a payout and records payment evidence and a reference after an actual external payment has been verified.

Changing Site sharing is a separate explicit action. This repository does not broaden the private site's audience. Customers and partners must be allowed by Site access policy before they can sign in.

## Local development and demo accounts

Requires Node 22.13+ and npm. The review instance runs at `http://127.0.0.1:5175/`.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5175
# In a second terminal, after the local database is initialized:
npm run demo:setup
```

- Agent sign-in: `/login/agent`; company sign-in: `/login/company`; chooser: `/login`.
- Setup generates distinct random passwords once, stored in ignored `.sites-runtime/demo-credentials.json` with owner-only file permissions. The demo identities are `agent@solaris.demo` and `company@solaris.demo`.
- Running setup again preserves passwords, existing company configuration and existing records. It adds only missing demo identities/fixtures. It accesses only the checkout’s local SQLite database, never a remote service.
- Example leads, surveyed/quoted/installation-stage projects, a kit and staff profiles let you explore the workflow immediately. Sample figures and quotations are not commercial offers. Staff fixture profiles do not have passwords.
- Agent requirements persist in local D1 and appear in the company’s lead list. Company updates flow back to the referring agent. Private uploads use local R2.
- The server checks account role at sign-in, uses salted scrypt password hashes (`N=16384, r=8, p=5`) and stores only hashes of random session tokens. Cookies are HttpOnly and SameSite=Lax (Secure on HTTPS); sessions expire after 12 hours. Sign-in rotates the existing session, logout invalidates it, suspended users lose access, and failed attempts are rate limited.
- Password demo login is compiled on only for portable `serve` mode. Production builds continue using the existing Sites identity. Do not publish demo credentials or seed fixtures to a hosted database.

The new local auth tables are in migration `0003_local_portal_auth.sql`. Existing hosted migration and identity behavior are otherwise preserved. All local state is ignored by Git.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

Nineteen authentication and service/database tests use real SQLite transactions and the same business service as the deployed APIs. They cover the complete multi-role referral-to-payout lifecycle, KYC, cross-account access denial, duplicate leads/incentives/payouts, quote arithmetic and snapshots, failed inspection, rejected documents, project cancellation/delay, stale writes, cash/finance rules, payment evidence, rate limiting and file permissions.

With the local server running and demo setup complete:

```sh
npm run test:http
```

This intentionally creates local-only fixtures. It verifies public/login pages, protected redirects, both role-specific sign-ins, wrong passwords/portal selection, CSRF rejection, agent/company isolation, persisted lead-to-project handoff, private R2 upload/download, malformed JSON errors and session revocation. It refuses non-local targets.

Desktop visual and interaction QA completed in native Chrome: the company login and dashboard, agent login/dashboard, and customer-requirement dialog were inspected. The browser-extension host was unavailable, so native app automation was used. Responsive breakpoints are implemented; a dedicated mobile-device visual review is still outstanding. TypeScript, production build and authenticated local page checks pass.

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

`.openai/hosting.json` binds this source to its existing private Site, D1 and R2. Keep that project ID when making future edits. Publish through the Sites source/build/version workflow. All hosted database migrations are applied by Sites; do not run local test fixtures against production.
