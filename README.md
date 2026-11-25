# Samerika Power Private Limited — Solar Business Platform

A responsive solar company website and connected operations workspace with logo-matched blue navigation, light surfaces, orange actions and green success accents, landscape illustrations, rounded cards and separate company, staff and agent sign-in pages. Phone layouts include bottom navigation, readable record cards, touch-sized controls and scrollable forms.

The dashboard combines the supplied mobile layout reference with the Samerika logo palette: a blue landscape welcome card, blue project insights with orange highlights, leaf-green completion states, light cards and bottom navigation on smaller screens. The desktop workspace keeps a sidebar and schedule/update column. Charts use role-scoped stored records; progress percentages measure completed installation steps. The original reference image is not redistributed.

## What works

- Public solar solutions, installation process, partner programme and FAQ pages. Homepage Enquire now buttons open a compact, mobile-friendly `/enquiry` form without sign-in. Submissions create New leads with Website attribution and administrator notifications; duplicates preserve existing ownership. Contact details remain unverified until follow-up. Confirm site details on a website lead before project conversion or quotation creation.
- Password/session sign-in and eight server-enforced business roles: administrator, customer, partner, sales, relationship manager, technician, document reviewer and finance.
- Partner applications, private KYC uploads, KYC review and account approval.
- Database-backed enquiries, mobile/email duplicate protection, original partner attribution, sales assignment, call notes and follow-up dates.
- Lead conversion into unique projects with assigned managers, technicians and reviewers.
- Product/service catalogue with editable prices, units, HSN/SAC and item GST rates. Select a customer and multiple items to prepare a quotation with a live preview, quantities, discount, GST summary, amount in words, terms and A4 print/PDF. The first quote creates its linked project automatically. Saved prices and customer/company details remain immutable snapshots, with internal approval, customer publishing and acceptance/rejection. Configure company address, GSTIN, bank details and default quotation terms in Settings.
- Site surveys, private project documents, document review, bank/DISCOM/net-metering approval tracking.
- Eight installation phases, evidence references, quality results, handover acknowledgement and completion gates.
- Configurable per-kW incentives captured with their rule snapshot, admin approval, finance payout records, failed-payment retry and verified payment evidence.
- Unique payout per incentive and unique payment reference for paid payouts. Paid records cannot be overwritten.
- Customer collection recording with uploaded evidence, support tickets and replies, in-app project notifications, audit history and role-scoped CSV exports.
- Live dashboard totals from stored records. Local demo fixtures are clearly labeled; dashboard totals are calculated from the records visible to the signed-in role.
- Application tracking uses nine bilingual workflow stages: Site Survey, Quotation, Order Confirmation, Customer Registration, Installation, DCR Registration, Net Metering, Subsidy Application and Subsidy Received. Each stage supports Pending, In Progress, Completed and Hold / Rejected, with a required status date, server-recorded employee identity, reference, comment and retained update history. Complete earlier stages before progressing; a hold requires a reason. All nine completed stages show the workflow's Project Completed badge without overriding the separate installation/payment completion checks.
- Earlier ten-stage application records remain available under **Earlier application records**. They are preserved when a project is first updated using the new workflow, with no automatic inference that the new milestones are complete. No database schema migration is needed.

## Vercel deployment

This project now uses **Next.js on Node 22**, **Turso libSQL** for persistent SQLite data, and a **private Vercel Blob store** for documents. The former Vinext build produced Worker output instead of `.next/routes-manifest.json`; `npm run build` now invokes `next build --webpack`, and `vercel.json` selects the Next.js framework and `.next` output.

1. In Vercel, import `intoxiagmb-crypto/samerika`, branch `main`, with this repository root as the root directory. Use the Next.js preset, `npm run build`, `.next`, and Node 22.x. Remove any old dashboard override pointing to Vinext or `dist`.
2. Create/connect a **Turso libSQL database** and a **private** Vercel Blob store. Set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `BLOB_READ_WRITE_TOKEN` in the Vercel project's Production environment. Use separate database and storage resources for Preview deployments. These are server secrets; never use `NEXT_PUBLIC_` names.
3. Copy `.env.example` to ignored `.env.local` locally and enter the same database credentials securely. Run `npm ci`, then `npm run db:migrate` once against the intended database. Migrations run in a transaction and record checksums; repeat runs skip completed migrations. The build does not modify databases.
4. Run `npm run admin:create` in an interactive local terminal using those database credentials. It prompts for the owner's name, email and a password of at least 12 characters (hidden input). It refuses to create a second bootstrap administrator. There is no public first-visitor administrator registration.
5. Deploy/redeploy the `main` commit. Sign in at `/login/company`. Under **People & partners**, choose **Create account** to add staff, customers and agents. Administrators use `/login/company`, employees use `/login/staff`, and partners use `/login/agent`. The public login chooser shows these three entry points. The legacy customer route remains available for existing accounts. Active Sales and Manager staff receive new enquiry notifications and share unassigned Website/Channel Partner enquiries; assigned enquiries follow existing record permissions. Company administrators retain oversight but receive no new enquiry intake notifications. Create at least one active Sales or Manager account before accepting inbound enquiries. Share credentials privately. **Reset password** revokes all existing sessions for that account. Pending partner accounts can sign in and submit KYC; they cannot create leads until the administrator verifies KYC and activates them.
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

Local development stores SQLite in ignored `.solaris/local.db` and private files in `.solaris/files`. Demo setup creates four local accounts (company admin, sales staff, agent and legacy customer) with distinct random passwords in ignored `.solaris/demo-credentials.json` (owner-only permissions), preserves existing accounts and refuses to run with remote database/storage credentials. It does not create production users or overwrite the old local Cloudflare state.

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

Brand: Samerika Power Private Limited. The supplied company logo is recreated as transparent SVG paths in `public/brand/`, with stacked, horizontal, wordmark and emblem variants; lettering is outlined and needs no font. The same emblem is used as the favicon. Current artwork: original code-native solar-home SVG in `components/solar-scene.tsx`. The legacy Earth asset is retained but unused. Fonts: DM Sans and Manrope via Google Fonts with system fallbacks. Icons: Lucide.

Design research: [Aurora solar sales workflow](https://docs.aurorasolar.com/reference/common-workflows) informed the enquiry-to-survey-to-quotation flow; [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) and [password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) informed local sign-in and session handling.

GitHub pushes trigger Vercel builds when the repository is connected. Production database migrations and account bootstrap are explicit operator steps, never demo seeding during deployment.

Application tracking is available at `/portal?view=tracking` and from each project's **Track application** button. It records the ten application milestones separately from the installation checklist. Admin, Sales and Manager users with project access can save an application number, stage status, status date and acknowledgement/progress note. Agents and customers can read only their accessible projects. Existing projects start with pending tracking stages; no government status is inferred. Updates are manual, sequenced, audited and protected against stale saves; they do not mark an installation complete or verify a subsidy payment. Desktop uses a horizontal timeline; phones use a vertical timeline.

The public homepage uses a full-width solar rooftop hero, property offerings, benefits, a project enquiry planner, installation process, illustrative tracking preview, three login entry points and accessible FAQs. The visual layout was inspired by the user-supplied SolarSquare homepage; Samerika branding and original copy are used. The rooftop hero is AI-generated illustrative imagery, not a completed customer installation. The planner carries validated property type, PIN and estimated monthly bill into the existing enquiry form; contact details and submission remain in that form. No customer ratings, savings guarantees or installation counts are invented. See `docs/homepage-visual.md` for the image prompt and provenance.
