# Compliance Compass

Build a web app called "Legal Metrology Compliance Checker" — an enforcement

portal for Indian government officials to scan packaged product labels for

regulatory compliance.

BACKEND: Do NOT use Lovable's built-in Supabase backend or auth. This app

connects to an existing FastAPI backend at <YOUR_BACKEND_URL>. Fetch and

follow the OpenAPI spec at <YOUR_BACKEND_URL>/openapi.json as the source of

truth for all endpoints, request/response shapes, and data models. Store the

backend URL as VITE_API_BASE and build all requests through a single API

client file (src/lib/api.ts) — every page should import from that file only.

AUTH: JWT-based. POST to /auth/login with form-urlencoded fields

"username" (the user's email) and "password" — returns {access_token,

token_type}. Store the token and attach it as "Authorization: Bearer <token>"

on every subsequent request. Redirect to /login if a request returns 401.

DESIGN: Professional government enforcement-portal aesthetic — navy blue

primary color, clean data tables, no playful/consumer-app styling. This is

used by inspection officers, not shoppers.

PAGES:

1. Login — email/password form, calls /auth/login.

2. Dashboard (home, protected route) — calls GET /dashboard/stats, shows

   total scans, compliant vs non-compliant counts as stat cards, and a bar

   chart of violations grouped by rule reference (violations_by_rule).

3. New Scan (/upload) — file upload form for a product image, optional

   product_id field, submits via POST /scans/upload (multipart/form-data,

   field name "file"), then redirects to the scan result page using the

   returned scan id.

4. Scan Result (/scans/:id) — calls GET /scans/{id}. Shows overall

   COMPLIANT/NON-COMPLIANT status (green/red) based on whether violations

   is empty, the uploaded image, a list of extracted_fields (field_type +

   value + confidence), a table of violations (rule_ref, field_type,

   description, severity — color-code severity: minor=yellow, major=orange,

   critical=red), and a "Download PDF Report" button that calls

   GET /reports/{scan_id}/pdf and downloads the file.

5. History (/history) — calls GET /scans/, a searchable/sortable table of

   past scans (date, status, violation count) linking to each scan's result

   page.

Include a navbar with links to Dashboard, New Scan, History, and a logout

button that clears the stored token.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/30fe5333-cfdd-4c16-84e0-2e4aa322ebf9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
