[comment]: # (	LICENSE)
[comment]: # (	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not)
[comment]: # (	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.)
[comment]: # ()
[comment]: # (	END LICENSE)

# Contributing to SLIME

## Documentation for contributors

The main documentation for contributors can be found at the contributor [README](./contributor/README.md). This documentation is
also available in the TypeDoc documentation in the `slime.internal` namespace.

## Personal agent instructions in devcontainers

Contributors can configure personal instructions for coding agents via files in the host path `local/agents`. In the devcontainer,
this host directory is mounted through `docker-compose.yaml` as `/config/.agents`.

Recommended setup:

* Create `local/agents/README.md` as the primary entry point for your personal instructions on the host.
* In the devcontainer, this same file is available at `/config/.agents/README.md`.
* Add one or more instruction files in `local/agents` and reference them from `local/agents/README.md`.
* The VSCode task "Open my personal agent instructions" will bring these instructions up in the editor, if they exist.

Agent behavior in this repository is configured to read `/config/.agents/README.md` first, then follow references from that file.

## Devcontainer Compose ports and project naming

The devcontainer uses Docker Compose with container ports published without fixed host ports. Docker assigns an available host
port for each published container port.

To discover the host port currently assigned to a service port, run:

```bash
docker compose --project-name <project-name> port local 3000
docker compose --project-name <project-name> port local 3001
docker compose --project-name <project-name> port local 8000
```

For devcontainers, project-name uniqueness is derived from the host workspace path. During
`.devcontainer/initializeCommand`, the repository path is hashed and written to the repository-root `.env`
as `COMPOSE_PROJECT_NAME=slime-<hash>`.

To discover the active project name, use `docker compose ls` on the host, then run the
`docker compose --project-name ... port ...` commands above.

Within the `local` container, these ports are used as follows:

* `3000`: Webtop desktop HTTP interface.
* `3001`: Webtop desktop HTTPS interface.
* `8000`: HTTP endpoint used by project-local web tooling, including the documentation server (`./wf documentation` / `./fifty view`).

If you need unique naming for non-devcontainer Compose usage, set `COMPOSE_PROJECT_NAME` (or pass `--project-name`) when invoking
`docker compose`.

## Continuous integration testing

When code is contributed via a PR, it must pass a series of checks on the server. These checks run by platform and are defined in
the `.github/workflows` directory.

* Java (21, 17, 11, 8) - defined by `test-jdk[n].yaml`, where `n` is the major version number, which in turn runs
`contributor/suite-docker-jrunscript [n]`, which in turn runs `./wf check` under Linux via Docker, which in turn:
  * Runs linting via ESLint
  * Runs type checking via the TypeScript compiler
  * Runs tests by installing Rhino and running the `contributor/jrunscript.jsh.js` script under `jsh`.
* MacOS/Java (Java 21) - defined by `test-jdk-macos.yaml`, also runs `./wf check`, with the same steps as above
* Browsers (Chrome, Firefox) - defined by `test-browsers.yaml`, which runs `contributor/suite-docker-browser`, which runs
`/slime/contributor/suite-docker-browser.jsh.js` under `jsh`. This runs API tests for Chrome and Firefox, as well as tests verifying
the browser implementation of the JSAPI test framework.
* Node.js - defined by `test-node.yaml`, which runs `contributor/suite-docker-node`, which runs
`./fifty test.jsh loader/node/loader.fifty.ts`

## Older contributor documentation

Currently, most contributor information is in [contributor/README.html](contributor/README.html), but it is being migrated to other
locations.
