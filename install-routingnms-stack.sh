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
  DB_PASSWORD="$(grep -m1 'name="opennms-admin"' -A0 "$DATASOURCES_FILE" | grep -o 'password="[^"]*"' | cut -d'"' -f2)"
  echo "-- Reusing existing DB password from previous install --"
else
  DB_PASSWORD="$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 24)"
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

  opennms:
    image: opennms/horizon:latest
    container_name: routingnms-backend
    restart: unless-stopped
    depends_on: [postgres]
    command: ["-s"]
    ports:
      - "8980:8980"
      - "8101:8101"
      - "1162:1162/udp"
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
    depends_on: [opennms]
    ports:
      - "80:3000"
    environment:
      ROUTINGNMS_API_URL: "http://opennms:8980/opennms"
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
echo "   http://${IP}/"
echo ""
echo " Backend web console (unchanged OpenNMS UI, for comparison):"
echo "   http://${IP}:8980/opennms   — login admin / admin, it will force a password change"
echo ""
echo " First boot runs full DB init and can take several minutes. Watch progress:"
echo "   docker compose -f ${STACK_DIR}/docker-compose.yml logs -f opennms"
echo ""
echo " Frontend login uses the SAME admin/admin credentials against the backend above —"
echo " once you change the OpenNMS admin password, use the new one to log into the frontend too."
echo "======================================================"
