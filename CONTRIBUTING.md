[comment]: # (	LICENSE)
[comment]: # (	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not)
[comment]: # (	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.)
[comment]: # ()
[comment]: # (	END LICENSE)

# Contributing to SLIME

## TypeScript documentation

Some contributor documentation has been migrated to TypeScript and is in the `slime.internal`
[namespace comment](./contributor/README.fifty.ts), and also available when browsing the TypeDoc documentation.

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
places, including here.
