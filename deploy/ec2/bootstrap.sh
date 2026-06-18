#!/usr/bin/env bash
# Runs on the EC2 instance (via user-data) from the extracted deploy bundle.
# Sets up Node + PostgreSQL (local) + nginx, installs the app, migrates, starts.
set -euxo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"

# 1. Packages (Amazon Linux 2023)
dnf install -y nodejs postgresql15 postgresql15-server nginx tar

# 2. PostgreSQL: init, localhost-trust (single box, DB not network-exposed), start
if [ ! -d /var/lib/pgsql/data/base ]; then
  /usr/bin/postgresql-setup --initdb
fi
PGHBA=/var/lib/pgsql/data/pg_hba.conf
sed -i -E 's@^(host[[:space:]]+all[[:space:]]+all[[:space:]]+127\.0\.0\.1/32[[:space:]]+).*@\1trust@' "$PGHBA"
sed -i -E 's@^(host[[:space:]]+all[[:space:]]+all[[:space:]]+::1/128[[:space:]]+).*@\1trust@' "$PGHBA"
systemctl enable --now postgresql
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='miaomiao'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE ROLE miaomiao LOGIN;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='miaomiao'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE miaomiao OWNER miaomiao;"
systemctl restart postgresql

# 3. App files
mkdir -p /opt/miaomiao/server /opt/miaomiao/web
cp -r "$HERE/server/." /opt/miaomiao/server/
cp -r "$HERE/web/." /opt/miaomiao/web/
cp "$HERE/server.env" /opt/miaomiao/server.env
chown -R ec2-user:ec2-user /opt/miaomiao
chmod -R a+rX /opt/miaomiao/web

# 4. Migration (as the miaomiao owner over localhost-trust)
psql -h 127.0.0.1 -U miaomiao -d miaomiao -f "$HERE/migration.sql"

# 5. API server (systemd)
cp "$HERE/miaomiao.service" /etc/systemd/system/miaomiao.service
systemctl daemon-reload
systemctl enable --now miaomiao

# 6. nginx (serves web + proxies /trpc, /api to :3000)
cp "$HERE/nginx.conf" /etc/nginx/nginx.conf
systemctl enable --now nginx
systemctl restart nginx

touch /opt/miaomiao/READY
echo "BOOTSTRAP_DONE"
