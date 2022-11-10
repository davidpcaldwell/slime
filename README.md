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

### Using `curl` (installed on macOS)

```bash
curl -v -L https://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh.bash | bash -s https://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh/test/jsh-data.jsh.js
```

### Using `wget` (installed on many Linux distributions lacking `curl`)

```bash
wget https://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh.bash -O - | bash -s https://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh/test/jsh-data.jsh.js
```

## Getting Started: Using SLIME locally

### TL;DR

* `git clone https://github.com/davidpcaldwell/slime.git; cd slime`
* `./jsh.bash jsh/test/jsh-data.jsh.js` - runs a sample program emitting information about the installed `jsh` shell.
* `./fifty view` - runs a server that serves the SLIME documentation and opens an instance of Google Chrome to browse it.

### Getting the code

To be able to work with SLIME locally, you'll want to get the code. SLIME is a scripting platform, and so it is written with the
philosophy that essentially nothing should be prebuilt; it runs from its own source code. You can clone the source code from
[GitHub](https://github.com/davidpcaldwell/slime) or
[download](https://github.com/davidpcaldwell/slime/archive/refs/heads/master.zip) it and unzip it.

### Executing `jsh` scripts

At that point, it is ready to use; SLIME is capable of installing its own dependencies (including Java, Node.js, and TypeScript)
over the internet.

The top-level [`jsh.bash`](src/jsh.bash) script can be used to run scripts. `jsh` scripts that are top-level scripts and intended to
be used as main programs are denoted by the suffix `.jsh.js`. The example `jsh-data.jsh.js` invocation above will run a script that
will output a JSON data structure describing the shell.

### Running the documentation server

The documentation server can be run with the `./fifty view` command, which will start a server and Google Chrome browser for
displaying SLIME documentation locally.
