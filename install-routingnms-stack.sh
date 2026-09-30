#!/usr/bin/env bash
# RoutingNMS one-shot installer
# Brings up: Postgres + OpenNMS backend (official image, untouched) +
# the RoutingNMS Next.js frontend, all wired together with Docker Compose.
#
# Usage (on a fresh Ubuntu box, as root or with sudo):
#   curl -fsSL https://raw.githubusercontent.com/ihtishamshahzad7/NMS/main/install-routingnms-stack.sh | sudo bash
#
# Safe to re-run: it updates the existing checkout and reuses the same
# DB password instead of generating a new one each time.

set -euo pipefail

REPO_URL="https://github.com/ihtishamshahzad7/NMS.git"
INSTALL_DIR="/opt/routingnms-app"
STACK_DIR="$INSTALL_DIR/deploy-stack"
DATASOURCES_FILE="$STACK_DIR/opennms-etc-overlay/opennms-datasources.xml"

echo "== RoutingNMS one-shot installer =="

# --- 1. Docker -------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "-- Installing Docker --"
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
else
  echo "-- Docker already installed --"
fi

# --- 2. Get the repo ---------------------------------------------------
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "-- Updating existing checkout at $INSTALL_DIR --"
  git -C "$INSTALL_DIR" pull
else
  echo "-- Cloning RoutingNMS into $INSTALL_DIR --"
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

mkdir -p "$STACK_DIR/opennms-etc-overlay"

# --- 3. DB password: reuse if this is a re-run, else generate ----------
if [ -f "$DATASOURCES_FILE" ]; then
  DB_PASSWORD="$(grep -A5 'name="opennms-admin"' "$DATASOURCES_FILE" | grep -o 'password="[^"]*"' | head -1 | cut -d'"' -f2)"
  echo "-- Reusing existing DB password from previous install --"
else
  DB_PASSWORD="$(openssl rand -hex 16)"
  echo "-- Generated new DB password --"
fi

# --- 4. Datasource overlay (this is how the OpenNMS image wants DB creds,
#        confirmed by reading its actual entrypoint script — no env vars) --
cat > "$DATASOURCES_FILE" << XML
<?xml version="1.0" encoding="UTF-8"?>
<datasource-configuration xmlns="http://xmlns.opennms.org/xsd/config/opennms-datasources">
  <connection-pool factory="org.opennms.core.db.C3P0ConnectionFactory"
    idleTimeout="600" loginTimeout="3" minPool="10" maxPool="50" maxSize="50" />
  <jdbc-data-source name="opennms"
    database-name="opennms"
    class-name="org.postgresql.Driver"
    url="jdbc:postgresql://postgres:5432/opennms"
    user-name="opennms"
    password="${DB_PASSWORD}" />
  <jdbc-data-source name="opennms-admin"
    database-name="template1"
    class-name="org.postgresql.Driver"
    url="jdbc:postgresql://postgres:5432/template1"
    user-name="postgres"
    password="${DB_PASSWORD}" />
</datasource-configuration>
XML

# --- 5. Compose stack ----------------------------------------------------
cat > "$STACK_DIR/docker-compose.yml" << COMPOSE
services:
  postgres:
    image: postgres:15
    container_name: routingnms-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: "${DB_PASSWORD}"
    volumes:
      - routingnms-pgdata:/var/lib/postgresql/data
    networks: [routingnms-net]

  routingnms-backend:
    image: opennms/horizon:latest
    container_name: routingnms-backend
    restart: unless-stopped
    depends_on: [postgres]
    command: ["-s"]
    ports:
      - "8980:8980"
      - "8101:8101"
      # 1162 is mapped to a non-standard host port — some boxes already have
      # something (snmptrapd, another agent) bound to the standard port.
      - "11620:1162/udp"
      - "10514:10514/udp"
    volumes:
      - routingnms-data:/opennms-data
      - ./opennms-etc-overlay:/opt/opennms-etc-overlay:ro
    networks: [routingnms-net]

  frontend:
    build:
      context: ../frontend
    container_name: routingnms-frontend
    restart: unless-stopped
    depends_on: [routingnms-backend]
    ports:
      # 8080, not 80 — many boxes already have Apache/nginx on 80 (e.g. a
      # prior Cacti-based install). Once you're ready to fully cut over,
      # stop whatever else owns port 80 and change this to "80:3000".
      - "8080:3000"
    environment:
      ROUTINGNMS_API_URL: "http://routingnms-backend:8980/opennms"
      ROUTINGNMS_API_USER: "admin"
      ROUTINGNMS_API_PASSWORD: "admin"
      NODE_ENV: "production"
    networks: [routingnms-net]

networks:
  routingnms-net:

volumes:
  routingnms-pgdata:
  routingnms-data:
COMPOSE

# --- 6. Bring it up --------------------------------------------------------
cd "$STACK_DIR"
docker compose up -d --build

IP="$(hostname -I | awk '{print $1}')"
echo ""
echo "======================================================"
echo " RoutingNMS stack starting."
echo ""
echo " New frontend (what your boss should look at):"
echo "   http://${IP}:8080/"
echo ""
echo " Backend web console (unchanged OpenNMS UI, for comparison):"
echo "   http://${IP}:8980/opennms   — login admin / admin, it will force a password change"
echo "   (the URL path is /opennms — that's baked into the backend's own webapp,"
echo "    not something this stack renames; only the untouched engine lives there)"
echo ""
echo " First boot runs full DB init and can take several minutes. Watch progress:"
echo "   docker compose -f ${STACK_DIR}/docker-compose.yml logs -f routingnms-backend"
echo ""
echo " Frontend login uses the SAME admin/admin credentials against the backend above —"
echo " once you change the OpenNMS admin password, update ROUTINGNMS_API_PASSWORD in"
echo " ${STACK_DIR}/docker-compose.yml and run 'docker compose up -d' again."
echo ""
echo " NOTE: if port 80 or 8080 was already taken on this box by a leftover process,"
echo " this script does NOT auto-detect or kill it — check with 'ss -tlnp' and free it"
echo " (or change the frontend port mapping above) before re-running."
echo "======================================================"
