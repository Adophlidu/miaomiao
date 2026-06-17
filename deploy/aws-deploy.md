# Deploying miaomiao to AWS

Target architecture (lowest-ops managed), region **ap-southeast-1**:

| Piece | Service | Notes |
|---|---|---|
| Web (`apps/web`) | **Amplify Hosting** | builds from GitHub via `amplify.yml`; HTTPS; SPA rewrite rule |
| Server (`apps/server`) | **App Runner** (source-based, `apprunner.yaml`) | builds from GitHub; HTTPS; port 3000 |
| Database | **RDS PostgreSQL** | private; reached from App Runner via a VPC connector |
| Secrets / config | **Secrets Manager** + service env | `DATABASE_URL`, `BETTER_AUTH_SECRET`; URLs as plain env |

> **Status: not yet executed.** Run `aws sso login` (or your auth method) first — the CLI
> session was expired. Each `aws` step below should be run/verified interactively; some
> values (default VPC/subnets, App Runner Node runtime availability, generated URLs) must
> be read from your account at run time, so treat the commands as a checklist, not a
> blind script. Several steps **create billable resources** — confirm before each.

## 0. Prereqs
- `aws sso login` → `aws sts get-caller-identity` succeeds.
- `export AWS_REGION=ap-southeast-1`
- GitHub repo connected to AWS (Amplify + App Runner use a GitHub connection / CodeStar connection). Authorize once in the console (Amplify "Connect app" and App Runner "GitHub connection") — these OAuth handshakes are easiest in the console.

## 1. Networking + RDS (billable)
1. Use the **default VPC** (or note a target VPC). Get subnets + a security group.
2. Create a DB security group `miaomiao-db-sg` allowing inbound 5432 **only** from the App Runner VPC-connector SG (created in step 3).
3. Create RDS Postgres (smallest viable, not publicly accessible):
   ```
   aws rds create-db-instance --db-instance-identifier miaomiao-db \
     --engine postgres --db-instance-class db.t4g.micro --allocated-storage 20 \
     --master-username miaomiao --master-user-password '<STRONG_PW>' \
     --db-name miaomiao --no-publicly-accessible \
     --vpc-security-group-ids <miaomiao-db-sg> --region $AWS_REGION
   ```
4. After it's `available`, the endpoint → build `DATABASE_URL`:
   `postgresql://miaomiao:<PW>@<endpoint>:5432/miaomiao`

## 2. Secrets (Secrets Manager)
```
aws secretsmanager create-secret --name miaomiao/DATABASE_URL --secret-string '<DATABASE_URL>'
aws secretsmanager create-secret --name miaomiao/BETTER_AUTH_SECRET --secret-string "$(openssl rand -hex 32)"
```

## 3. App Runner (server, billable) — depends on RDS + secrets
1. Create a **VPC connector** in the same subnets as RDS (its SG is what RDS SG allows on 5432).
2. Create the App Runner service from the **GitHub source** (uses `apprunner.yaml`):
   - Source: this repo, branch `main`, root `/`.
   - Instance role: allow `secretsmanager:GetSecretValue` on the two secrets.
   - Runtime env: `BETTER_AUTH_URL` = (the App Runner service URL, known after first deploy — set it, then redeploy), `CORS_ORIGIN` = (Amplify URL from step 4).
   - Runtime secrets: `DATABASE_URL`, `BETTER_AUTH_SECRET` → the Secrets Manager ARNs.
   - Egress: the VPC connector (so it can reach RDS).
3. First deploy gives the service URL `https://<id>.ap-southeast-1.awsapprunner.com`. Set `BETTER_AUTH_URL` to that URL and redeploy.

> App Runner Node runtime: `apprunner.yaml` pins `nodejs22`. If the account/region doesn't
> offer it yet, drop to `nodejs18` (the bundled ESM server runs on 18+).

## 4. Run the DB migration (once RDS is reachable)
Easiest: a one-off from a machine that can reach RDS (e.g. temporarily mark RDS publicly
accessible + allow your IP, run migrate, then lock back down), or run from the App Runner
shell / a small bastion:
```
DATABASE_URL='<DATABASE_URL>' pnpm run db:migrate
```

## 5. Amplify (web) — depends on the App Runner URL
1. Connect the GitHub repo in Amplify; it auto-detects `amplify.yml`.
2. Set build env var **`VITE_SERVER_URL`** = the App Runner HTTPS URL.
3. Add a **SPA rewrite**: source `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff2?|map|json)$)([^.]+$)/>` → target `/index.html`, type `200 (Rewrite)`.
4. Deploy → Amplify URL `https://<branch>.<id>.amplifyapp.com`.

## 6. Wire the URLs (the chicken-and-egg)
1. Web build needs the **server URL** → set `VITE_SERVER_URL` (step 5.2) and (re)deploy Amplify.
2. Server needs the **web URL** for CORS + auth → set App Runner `CORS_ORIGIN` = Amplify URL and `BETTER_AUTH_URL` = App Runner URL, then redeploy.
3. better-auth cookies are `secure` + `sameSite:none` → both must be HTTPS (they are). The web→server calls are cross-site with credentials; `CORS_ORIGIN` + `trustedOrigins` already handle it (`packages/auth`, `apps/server`).

## 7. Verify
- `curl https://<apprunner>/` → `OK`; `curl https://<apprunner>/trpc/healthCheck` → `{"result":{"data":"OK"}}`.
- Open the Amplify URL → register → record a transaction → confirm it persists.

## Teardown (to stop charges)
Delete in reverse: Amplify app → App Runner service + VPC connector → RDS instance
(`--skip-final-snapshot`) → Secrets Manager secrets → security groups.

## Rough monthly cost
RDS db.t4g.micro ~$12–15, App Runner ~$5–25 (scales with usage), Amplify ~$0–5,
Secrets Manager ~$0.80. Smallest realistic footprint ~$20–40/mo.
