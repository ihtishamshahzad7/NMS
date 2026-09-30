# Deploying RoutingNMS to your Ubuntu test client

Your backend is a full OpenNMS engine running in a Docker container — that's untouched and stays running exactly as it is (per the "don't break the backend" rule). What you're deploying is the **new frontend** as its own container, pointed at that existing backend. This is also faster and lower-risk than rebuilding the whole Java backend into a fresh image.

## Step 1 — Find your backend container on the Ubuntu box

SSH into the test client and run:

```bash
docker ps
```

Note the **container name** (or `--name` if you started it manually) and which **network** it's on:

```bash
docker inspect <backend-container-name> --format '{{.Name}} networks: {{json .NetworkSettings.Networks}}'
```

You need two things from this: the network name, and the port OpenNMS's REST API listens on inside the container (default `8980`).

## Step 2 — Get the frontend onto the box

From your dev machine, copy the `frontend/` folder to the Ubuntu client (it now has a `Dockerfile` and `docker-compose.frontend.yml` in it):

```bash
scp -r "F:\Web project\R-NMS\frontend" youruser@ubuntu-test-client:/opt/routingnms-frontend
```

(Or `git clone`/`git pull` the repo on the client instead, once you've pushed the latest commits.)

## Step 3 — Point the frontend at the backend

On the Ubuntu box, edit `/opt/routingnms-frontend/docker-compose.frontend.yml`:

- `ROUTINGNMS_API_URL` → `http://<backend-container-name>:8980/opennms` (use the container name from Step 1 — Docker's internal DNS resolves it on the shared network)
- `ROUTINGNMS_API_USER` / `ROUTINGNMS_API_PASSWORD` → the real admin credentials for that OpenNMS instance
- `networks.routingnms-net.name` → set this to the network name from Step 1 (so the frontend container can actually reach the backend container)

```yaml
networks:
  routingnms-net:
    external: true
    name: <the-network-name-from-step-1>
```

- `ports` → change `"80:3000"` if port 80 is already taken on that box (e.g. `"8080:3000"`).

## Step 4 — Build and start it

```bash
cd /opt/routingnms-frontend
docker compose -f docker-compose.frontend.yml up -d --build
```

First build takes a couple of minutes (installs deps + compiles). Check it's up:

```bash
docker compose -f docker-compose.frontend.yml logs -f
```

## Step 5 — Test

Open `http://<ubuntu-test-client-ip>/` (or `:8080` if you changed the port). You should hit the RoutingNMS login screen. Log in with the same OpenNMS admin credentials — the login form verifies them against the real backend.

If the login fails with "Couldn't reach RoutingNMS to verify credentials," the frontend container can't reach the backend container — re-check the network name in Step 3 (`docker network ls` to list them, `docker network inspect <name>` to confirm the backend container is a member).

## Step 6 — Replace what users see

Once you've confirmed it works, this is the "replace" part your boss asked for: whatever currently routes traffic to the old OpenNMS UI (nginx reverse proxy, a DNS entry, a bookmark) should now point at this frontend container's port instead. The old OpenNMS UI is still reachable directly on its own port if anyone needs it — nothing about the backend changed.

## Later, optional: rebuilding the backend itself into a routingnms-branded image

You are *not* doing this today — it's a multi-hour Maven build across ~11,000 files and carries real risk of breaking the engine. If you want it later: after running `rename-backend-modules.ps1` and confirming `mvn -q -N validate` passes, the standard OpenNMS build (`./assemble.pl` or `mvn -Prun-expensive-tasks install`) produces an installable assembly under `routingnms-assemblies/` (renamed from `opennms-assemblies/`) that a custom Dockerfile could package. Nothing here requires that step to work today.
