[comment]: # (	LICENSE)
[comment]: # (	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not)
[comment]: # (	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.)
[comment]: # ()
[comment]: # (	END LICENSE)

# SLIME: JavaScript with Java and more

## What is SLIME?

The SLIME project provides tools for JavaScript development on several platforms:

* Writing Java-enabled JavaScript scripts via the `jsh` scripting environment
* Writing JavaScript servlets for Java servlet containers (Tomcat, Jetty, etc.)
* Writing front-end code: Chrome, Firefox, Safari
* Using JXA, the macOS JavaScript automation framework

The Java-based environments support Mozilla [Rhino](https://github.com/mozilla/rhino) and OpenJDK [Nashorn](https://github.com/openjdk/nashorn). [GraalJS](https://github.com/oracle/graaljs) support is [under development](https://github.com/davidpcaldwell/slime/projects/10).

## Getting started: run a `jsh` script without installing anything

The following script runs the `master` version of the shell remotely and runs the remotely-hosted
[`jsh/test/jsh-data.jsh.js`](jsh/test/jsh-data.jsh.js) script which emits information about the executed shell:

```bash
curl -v -L https://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh.bash | bash -s https://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh/test/jsh-data.jsh.js
```

## Getting Started: develop locally

* `git clone https://github.com/davidpcaldwell/slime.git; cd slime`
* `./jsh.bash jsh/test/jsh-data.jsh.js` - runs a sample program emitting information about the installed `jsh` shell.
* `./fifty view` - runs a server that serves the SLIME documentation and opens an instance of Google Chrome to browse it.
