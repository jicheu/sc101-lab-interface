# SC101 Lab Interface — TODO

## Authentication

- [ ] **SSO integration** (`frontend/src/screens/LoginScreen.jsx`)  
  Replace username-only login with a proper SSO mechanism (e.g. OIDC / SAML / Ubuntu One).  
  Map `session.username` to the SSO identity subject claim.  
  Consider Keycloak or Ubuntu One as the identity provider.

---

## Infrastructure — Host Prerequisites

These steps must be completed on the host machine before running the application.

- [ ] **Pre-install required host tools**  
  Document and automate installation of:
  - `lxd` — container runtime (`snap install lxd`)
  - `snapcraft` — snap build tool (`snap install snapcraft --classic`)
  - `lxd init --auto` — initialise LXD storage pool and networking
  - Any other build-time dependencies (gcc, make, etc. inside the container)

- [ ] **Provision an Ubuntu Core image in LXD**  
  - Download or import an Ubuntu Core 24 image into LXD  
    (`lxc image copy ubuntu-core:24 local: --alias ubuntu-core-24`)  
  - Create a dedicated test container from that image  
    (`lxc launch ubuntu-core-24 sc101-core-test`)  
  - Expose the container to the backend so the tutorial can target it for snap testing

- [ ] **Connect to the Ubuntu Core container and install the snap**  
  - After a snap is built in the dev container, copy the `.snap` file to the Core container  
    (`lxc file push hello-snap.snap sc101-core-test/root/`)  
  - SSH / exec into the Core container and install with `--dangerous` flag  
    (`lxc exec sc101-core-test -- snap install /root/hello-snap.snap --dangerous`)  
  - Verify the snap runs correctly inside the confined Core environment

---

## Tutorial Content

- [ ] Complete all 6 steps of the `hello-snap` tutorial (writing C source, Makefile, snapcraft.yaml, build, install on Core, verify confinement)

---

## Backend

- [x] Support multiple tutorial IDs — tutorial selector screen added
- [x] Add a `DELETE /api/sessions/:id` endpoint to clean up stale sessions + destroy container
- [ ] Rate-limit session creation to avoid container sprawl

---

## Frontend

- [x] Tutorial selector screen with section grouping, progress tracking, dependency indicators
- [ ] Show live container status (starting / running / stopped) in the terminal pane header
- [ ] Mobile / narrow-screen layout (responsive split-pane or tabbed view)
- [ ] **Award page** — when a user completes all tutorials in the course, show a certificate/award page they can download as a PDF. Triggered when global progress reaches 100%.

---

## Security / Production

- [ ] Enforce LXD container resource limits (CPU, RAM, disk) per session
- [ ] Add HTTPS support (reverse proxy with nginx / Caddy + TLS)
- [ ] Implement session expiry and automatic container cleanup after N hours of inactivity (currently 60 s for dev convenience)
