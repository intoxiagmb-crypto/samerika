# Samerika Power Private Limited — Solar Business Platform

A responsive solar company website and connected operations workspace with logo-matched blue navigation, light surfaces, orange actions and green success accents, landscape illustrations, rounded cards and separate company, staff and partner sign-in pages. Phone layouts include bottom navigation, readable record cards, touch-sized controls and scrollable forms.

The dashboard combines the supplied mobile layout reference with the Samerika logo palette: a blue landscape welcome card, blue project insights with orange highlights, leaf-green completion states, light cards and bottom navigation on smaller screens. The desktop workspace keeps a sidebar and schedule/update column. Charts use role-scoped stored records; progress percentages measure completed installation steps. The original reference image is not redistributed.

## What works

- Public solar solutions, installation process, partner programme and FAQ pages. After 15 seconds on the homepage, a photo-and-form consultation popup opens at most once per browser-tab session. Opening the form manually also suppresses the automatic popup; closing or submitting it does not restart the timer in that session. The timer is cancelled when leaving the homepage, and an in-memory dismissal is retained during navigation if browser storage is unavailable. Manual enquiry links remain available. Enquiry links open `/enquiry` over the current page: a sliding bottom sheet on mobile and a centred dialog on desktop, with Close, Escape and browser Back support. Direct links render the same form over the homepage. The form collects name, WhatsApp number, monthly bill range, village/city and contact consent; planner defaults are preserved. Submissions create New leads with Website attribution and Sales/Manager notifications; duplicates preserve existing ownership. Contact details remain unverified until follow-up. Confirm site details on a website lead before project conversion or quotation creation.
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
- Application tracking and project details share the same Installation timeline component, status controls, upload action and saved project records. The timeline includes early application milestones, Documentation, approvals, installation phases, Subsidy and Customer handover. Progress and current-stage badges are computed from the same records. Earlier application milestones remain readable in Update history without acting as a second editable workflow.
- Earlier ten-stage application records remain available under **Earlier application records**. They are preserved when a project is first updated using the new workflow, with no automatic inference that the new milestones are complete. No database schema migration is needed.

## Vercel deployment

This project now uses **Next.js on Node 22**, **Turso libSQL** for persistent SQLite data, and a **private Vercel Blob store** for documents. The former Vinext build produced Worker output instead of `.next/routes-manifest.json`; `npm run build` now invokes `next build --webpack`, and `vercel.json` selects the Next.js framework and `.next` output.

1. In Vercel, import `intoxiagmb-crypto/samerika`, branch `main`, with this repository root as the root directory. Use the Next.js preset, `npm run build`, `.next`, and Node 22.x. Remove any old dashboard override pointing to Vinext or `dist`.
2. Create/connect a **Turso libSQL database** and a **private** Vercel Blob store. Set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `BLOB_READ_WRITE_TOKEN` in the Vercel project's Production environment. Use separate database and storage resources for Preview deployments. These are server secrets; never use `NEXT_PUBLIC_` names.
3. Copy `.env.example` to ignored `.env.local` locally and enter the same database credentials securely. Run `npm ci`, then `npm run db:migrate` once against the intended database. Migrations run in a transaction and record checksums; repeat runs skip completed migrations. The build does not modify databases.
4. Run `npm run admin:create` in an interactive local terminal using those database credentials. It prompts for the owner's name, email and a password of at least 12 characters (hidden input). It refuses to create a second bootstrap administrator. There is no public first-visitor administrator registration.
5. Deploy/redeploy the `main` commit. Sign in at `/login/company`. Under **People & partners**, choose **Create account** to add staff, customers and partners. Administrators use `/login/company`, employees use `/login/staff`, and partners use `/login/partner`. The public login chooser shows these three entry points. The legacy customer route remains available for existing accounts. Active Sales and Manager staff receive new enquiry notifications and share unassigned Website/Channel Partner enquiries; assigned enquiries follow existing record permissions. Company administrators retain oversight but receive no new enquiry intake notifications. Create at least one active Sales or Manager account before accepting inbound enquiries. Share credentials privately. **Reset password** revokes all existing sessions for that account. Pending partner accounts can sign in and submit KYC; they cannot create leads until the administrator verifies KYC and activates them.
6. In **Create account**, enter the employee's name and email, choose their role (Sales is the default), and click **Generate password** or enter at least 12 characters. Save, then use **Copy login details** in the confirmation dialog to share the correct sign-in link, email and password privately. The password is held only in the current dialog, never in browser storage; closing the dialog discards it. Use **Reset password** if the credentials are lost. Resetting an account also provides the same one-time credential handoff and signs out its existing sessions.
7. Configure company details, documents, catalogue and incentive rates in the dashboard before using real business records.

The build works without production secrets. Live sign-in and database operations require a migrated Turso database; uploads require a private Blob store. Vercel never falls back to a temporary local database or local uploaded files. No remote resources, credentials, migrations or live deployment are created merely by building or pushing the source.

Server uploads accept PDF, JPEG or PNG up to **2 MB**, leaving room for multipart overhead under Vercel's 4.5 MB function request limit. Files are read through an authenticated endpoint after project/owner permission checks. Blob objects are private; MIME signatures are checked before upload. The UI shows the same size limit.

Existing Cloudflare D1/R2 data is not automatically copied. This migration preserves the SQL schema and role/business rules, but an existing populated database or bucket requires a separate controlled data transfer. Do not point the initial schema migrations at an imported populated database without baselining its migration history. The previous `.openai/hosting.json` identity and legacy build helpers remain archived in the repository; Vercel does not use them or ChatGPT authentication headers.

## Quotation printing and customer sharing

- **Print / save A4 PDF** uses A4 portrait (210 × 297 mm), 12 mm margins, repeating item headings and flowing pages for long quotations. In the browser print dialog, turn off Headers and footers for a clean document. Shared customer quotations use the same printable document.
- **Settings → Edit settings** is admin-only. Set the company GST-registered state, GSTIN where applicable and quotation terms before preparing quotes. All new quotations snapshot these terms server-side. Staff cannot override terms through the form or API, and changing settings does not rewrite saved quotations.
- GST presentation is computed from the supplier state and the customer installation/site state. Matching states use CGST + SGST (CGST + UTGST for applicable union territories); different states use IGST. Known state abbreviations and older names are normalized. Missing/unknown states or conflicting GSTIN state codes block saving instead of guessing. Item rates still come from the catalogue; address does not determine the percentage. This implements the ordinary domestic installation workflow, not export, SEZ, or other special tax treatments.
- After the admin approves and **Publish to customer** sets a quotation to Sent, authorized company staff or the assigned partner can use **Prepare WhatsApp quotation → Open customer WhatsApp**. The saved Indian mobile number is selected automatically. The message contains a customer view/print link; the operator reviews it and presses Send in WhatsApp. This is click-to-chat, not automated message delivery or an automatically attached PDF. No WhatsApp availability/delivery claim is made.
- Customer links are bearer links: anyone holding the link can read that quotation without signing in. They expire after at most 30 days, capped at quotation validity (India time). The admin can **Revoke shared links**. Rejected/unpublished quotations stop resolving. Internal notes, account records and project history are excluded. Only token hashes are stored, in scoped entries of the existing settings table; no database migration is required. Pages are dynamic, no-store, noindex, and use no-referrer headers.

Implementation references: [WhatsApp click-to-chat](https://faq.whatsapp.com/5913398998672934), [GST place of supply for installation](https://cbic-gst.gov.in/pdf/e-version-gst-fliers/eflier-IGST-23062017.pdf), [official state codes](https://docs.ewaybillgst.gov.in/apidocs/state-code.html).

## Local development

Requires Node 22.13+ (22.x). With remote service variables unset:

```sh
npm ci
npm run demo:setup
npm run dev
```

Open `http://127.0.0.1:5175`. Partner sign-in is `/login/partner`, company sign-in is `/login/company`, and customer sign-in is `/login/customer`.

Local development stores SQLite in ignored `.solaris/local.db` and private files in `.solaris/files`. Demo setup creates four local accounts (company admin, sales staff, partner and legacy customer) with distinct random passwords in ignored `.solaris/demo-credentials.json` (owner-only permissions), preserves existing accounts and refuses to run with remote database/storage credentials. It does not create production users or overwrite the old local Cloudflare state.

For an empty local workspace without demo accounts, run `npm run db:migrate`, then `npm run admin:create`.

Passwords use salted scrypt hashes. Sessions use hashed random tokens, HttpOnly and SameSite=Lax cookies (Secure on HTTPS), a 12-hour expiry, rotation at login and revocation on logout/password reset. Suspended users lose access. Sign-in attempts are rate limited in the database. Incoming ChatGPT identity headers are not trusted for authentication.

## Verification

### Request performance

- Workspace loading batches its five to seven independent SELECTs into one read transaction through the libSQL adapter. Business and file endpoints reuse the session's authenticated user instead of fetching the same user again. Session/role checks still run on every request; private responses are not cached across users.
- Project progress groups records by project once, and project/lead membership uses a Set instead of scanning every lead for every project.
- Login, account creation and password reset use asynchronous scrypt with the existing salt, key length and work factors. This frees the Node event loop during hashing without changing stored passwords or reducing password security. Login and business rate-limit increments return their count from the same SQL statement.
- Public enquiries read all applicable rate-limit counters in one SELECT. Project notifications query only recipient IDs, with project/lead details joined in one query. Opening notifications updates their read state locally after the server confirms it instead of downloading the whole workspace again.
- Shared quotation page/PDF reads join the quotation and project, retaining expiry, publication and deleted-project checks. PDF and dashboard currency formatting reuse formatter instances.
- The public homepage is a Server Component with a small interactive FAQ component. The quotation builder loads on demand, and font origins have early connection hints.

These changes require no database migration. No tests, build verification or performance benchmarks were run for this performance change, as requested. The reduction in database calls is from code inspection, not measured latency. Successful website deployment makes these changes available in the existing Android APK; no APK reinstall is required for these server/web changes.

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

Project deletion returns the customer to Leads as **Project Back**. There is no lifetime limit on deleting and converting a lead again; only one non-deleted project can exist per customer at a time. Each new conversion creates a fresh project while retaining earlier deleted projects and records. If creation encounters the exact legacy `projects_lead_id_unique` index covering all projects, the authorized conversion request atomically replaces that index with the active-project-only index and retries the rolled-back creation batch once. This narrow compatibility repair also covers quotation-created projects; it does not run other migrations, mark migrations as applied, or change customer records outside the requested conversion. Other production migrations remain explicit operator steps.


Application tracking is available at `/portal?view=tracking` and through View application history in project details. Updates from either screen use the same business actions and refresh the shared project snapshot, including documents, approval references, notes, application number and progress. Permissions, version checks and explicit project-completion checks apply on both screens. Historical standalone installation/DCR/net-metering/subsidy records are preserved in Update history; they do not overwrite current phase records or block current timeline edits.

The public homepage uses a full-width solar rooftop hero, property offerings, benefits, a project enquiry planner, installation process, illustrative tracking preview, three login entry points and accessible FAQs. The visual layout was inspired by the user-supplied SolarSquare homepage; Samerika branding and original copy are used. The rooftop hero is AI-generated illustrative imagery, not a completed customer installation. The planner carries validated property type, PIN and estimated monthly bill into the existing enquiry form; contact details and submission remain in that form. No customer ratings, savings guarantees or installation counts are invented. See `docs/homepage-visual.md` for the image prompt and provenance.

### Mobile app presentation

Inside the Samerika Android APK, at widths up to 700px, public pages use the supplied Samerika app showcase as a visual reference: a centred brand header, compact rooftop hero, four quick actions, project cards and persistent Home / Projects / Calculator / Support / Profile navigation. Login, enquiries, about and project pages share the navy, pale-blue and orange treatment. The authenticated workspace keeps its role-aware navigation and records. Regular mobile and desktop browsers retain the original website layout, header links, footer and carousel. The hidden website carousel stops rotating only in the compact APK layout.

`/services` links to property-specific enquiries, `/contact` links to callbacks and the existing support/tracking workspace, and `/calculator` provides an indicative system-sizing plan using bill, tariff, available roof area and editable generation assumptions. It carries the property and bill into the existing enquiry form; it does not promise a subsidy, payback or appointment. Project-category filters apply to the illustrative gallery. Workspace links retain their destination through sign-in, restricted to known portal query keys; email/password authentication and server permissions are unchanged.

The existing APK appends `SamerikaAndroid/1.0` to its WebView user agent. A small synchronous document-head script recognises that token and sets `data-samerika-app="android"` before content paints. App-specific responsive CSS requires this attribute; screen width alone never enables the APK design. This is presentation detection only, not authentication. It uses no cookie, local storage, URL flag or user-agent-dependent server cache, so the same shared URL opens the original website in an ordinary browser. Public pages stay statically generated.

These are hosted web changes. A successful website deployment and a fresh app load deliver the APK layout without reinstalling the existing APK. The original app home and enquiry were visually reviewed at 400px. The browser/APK separation was checked against desktop Chrome, Android Chrome, iPhone Safari, a generic WebView and Samerika app tokens; all responsive overrides were checked for APK scoping, and the production build passed. No full automated test suite or physical Android device check was run.

The APK login entry and role-specific login pages use `components/apk-eco-login.tsx`, with the upper artwork of the user-supplied “Samerika Power Eco Login Screen” image displayed through a clipped header. The form, portal links and footer are real HTML controls, not a screenshot of a form. Browser login screens retain their previous presentation. Owner / Staff / Partner links preserve the requested workspace destination. Authentication still uses the existing email/password API and cookie/session confirmation; the reference's mobile-number field is not presented as supported authentication. “Remember email” is an unchecked, opt-in local preference that never stores passwords or extends the session. Forgotten-password help directs users to their administrator and the existing callback form. Production build and APK-only stylesheet checks passed; the new screen's browser preview could not be completed, and physical Android verification remains outstanding.
