# SLIME: JavaScript with Java and more

## What is SLIME?

The SLIME project provides tools for JavaScript development on several platforms:

* Writing Java-enabled JavaScript scripts via the `jsh` scripting environment
* Writing JavaScript servlets for Java servlet containers (Tomcat, Jetty, etc.)
* Writing front-end code: Chrome, Firefox, Safari
* Using JXA, the macOS JavaScript automation framework

The Java-based environments support Mozilla [Rhino](https://github.com/mozilla/rhino) and OpenJDK [Nashorn](https://github.com/openjdk/nashorn). [GraalJS](https://github.com/oracle/graaljs) support is [under development](https://github.com/davidpcaldwell/slime/projects/10).

## Getting Started

* `git clone https://github.com/davidpcaldwell/slime.git; cd slime`
* `./jsh.bash jsh/test/jsh-data.jsh.js` - runs a sample program emitting information about the installed `jsh` shell.
* `./fifty view` - runs a server that serves the SLIME documentation and opens an instance of Google Chrome to browse it.
