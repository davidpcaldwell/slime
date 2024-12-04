//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * `jsh` is a shell environment which allows JavaScript programs to be written which execute in the Java virtual machine and thus
 * can interact with Java platform classes and libraries written in Java or other JVM languages.
 *
 * `jsh` scripts have access to the global `jsh` object, which is of type {@link Global}.
 *
 * ## Configuration
 *
 * See [running `jsh`](../src/jrunscript/jsh/launcher/api.html) for information about how to run scripts using `jsh` and configure the
 * shell.
 *
 * ## Execution models
 *
 * `jsh` supports three execution models: an "unbuilt" shell executed directly from source, a "built" shell in which `jsh`
 * components are preprocessed and deployed to support faster startup, and a "packaged" shell in which a `jsh` script is packaged
 * into a standalone executable JAR file.
 *
 * ### Unbuilt shells
 *
 * Unbuilt shells can be executed from a source checkout (or over the internet, directly from GitHub). They are executed by
 * invoking the `bash` launcher at `./jsh` in the source tree. Currently, only macOS and Linux are supported.
 *
 * ### Built shells
 *
 * A built shell can be created by executing the `jrunscript/jsh/etc/build.jsh.js` script.
 *
 * In built shells, the `bash` launcher is located at `./jsh.bash` in the build directory, and the native launcher (if specified)
 * is located at `./jsh`. Both launchers expect the Java binaries to be in the `PATH`.
 *
 * ### Packaged applications
 *
 * TODO write documentation
 *
 * ### Remote shells
 *
 * TODO write documentation
 *
 * ## Older documentation
 *
 * See [old JSAPI-based `jsh` documentation](../src/jsh/etc/api.html).
 *
 * ## Contributor documentation
 *
 * Documentation about `jsh` internals can be viewed at {@link slime.jsh.internal}.
 *
 */
namespace slime.jsh {
	namespace db.jdbc {
		interface Exports {
			//	interface is built out via Declaration Merging (https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
		}
	}

	export interface Tools {
		jenkins: slime.jrunscript.tools.jenkins.Exports
		node: slime.jrunscript.tools.node.Exports
		install: slime.jrunscript.tools.install.Exports
		github: slime.jrunscript.tools.github.Exports
	}

	/**
	 * The global `jsh` object provided by the `jsh` shell.
	 *
	 * All code loaded by `jsh` also has access to the `$api` global object; see [$api](slime._api.global.html).
	 */
	export interface Global {
		java: slime.jrunscript.java.Exports & {
			tools: slime.jsh.java.tools.Exports,
			log: any
		}

		tools: Tools & {
			/**
			 * @deprecated See {@link slime.jsh.shell.tools.Exports | slime.jsh.shell.tools.Exports.rhino }
			 */
			rhino: {}
			tomcat: {}
			ncdbg: {}
		}

		script: slime.jsh.script.Exports

		js: slime.$api.old.Exports & {
			document: slime.old.document.Exports
			web: slime.web.Exports
		}

		file: slime.jrunscript.file.Plugin
		time: slime.time.Exports
		ip: slime.jrunscript.ip.Exports
		db: {
			jdbc: slime.jsh.db.jdbc.Exports
		}
	}
}

/**
 * ## The `jsh` command
 *
 * A `jsh` script begins with the `jsh` program, which determines which Java needs to be used (installing the default JDK if
 * necessary).
 *
 * It then runs the `jsh` _launcher_.
 *
 * ## The `jsh` launcher
 *
 * The `jsh` launcher is a `jrunscript` script that starts an engine-specific Java program that is capable of creating a `jsh` shell
 * and executing the indicated script inside it. Upon execution, it configures and starts the `jsh` _loader_ (see below).
 *
 * The launcher consists of the following components.
 *
 * ### `rhino/jrunscript/api.js`
 *
 * Creates `$api` as a property of `this` (the global object), and then invokes the bootstrap launcher at `jsh/launcher/main.js`.
 *
 * ### Bootstrap launcher (`jrunscript/jsh/launcher/main.js`)
 *
 * Essentially, the bootstrap launcher creates a `java` command for running the loader, which may be run either as a subprocess, or
 * as a Java invocation in a new class loader. The launcher calculates various named settings, which are passed to the loader as
 * system properties. The steps involved are as follows:
 *
 * * If invoked with the `-engines` argument (and that argument alone), provide a list of JavaScript engines
 * that the launcher is capable of using (because they are present either as built-in JDK engines or are installed), as a JSON array
 * of strings.
 * * If running an unbuilt shell, it compiles the loader classes.
 * * If running an unbuilt shell, sets the `jsh.shell.src` setting to let the Java launcher know where to find the code.
 * * Selects the appropriate Java implementation, and container implementation, to use if the `jsh.java.home` setting is specified.
 * * Selects the default JavaScript engine to use for executing the loader and sets it as the `jsh.engine` setting on the Java
 * command.
 * * Takes *leading* arguments that begin with `-`, switches the container implementation to a VM, and passes them as arguments to
 * the loader VM.
 * * If running on Rhino, sets the `jsh.engine.rhino.classpath` setting to the location from which Rhino was loaded.
 * * If running on Rhino and the profiler is invoked, sends the appropriate argument to the loader VM.
 * * Deal with settings that must be sent to a VM container, like `jsh.jvm.options`, and both switch the container to a VM and send
 * the arguments to that VM in an argument-appropriate way.
 * * Send other settings to the loader process as system properties.
 * * Run the {@link slime.jsh.internal.loader | loader}, using an engine-specific `main()` method, which ends up calling
 * `inonit.script.jsh.Main.cli()`, and exit with the status returned by the loader.
 *
 * #### `slime.js`
 *
 * This script, also apparently used in the `jsh` build process, creates an `$api.slime` object of type {@link
 * slime.internal.jsh.launcher.Slime} object providing SLIME-specific functionality.
 *
 * ### Packaged application launcher (`inonit.script.jsh.launcher.Main`)
 *
 * The Java launcher provides the entry point for running a `jsh` script when running inside a packaged application.
 *
 * <!--	TODO	remaining description of this launcher may be outdated (2018 Feb 15)	-->
 *
 * #### Settings used
 *
 * | Name | Description |
 * | ---- | ----------- |
 * | `jsh.shell.src` | If this is an unbuilt shell, the launcher needs to know where the root directory of the SLIME source code is. |
 * | `jsh.engine` | If specified, will override the default mechanism for selecting a JavaScript engine and use the specified value. |
 * | `jsh.engine.rhino.classpath` | If specified, will override the default mechanism for locating Rhino. |
 * | `jsh.launcher.debug` | If this is present, and Rhino is used to execute the launcher script, then the launcher script will be executed in the Rhino debugger. |
 *
 * #### Responsibilities
 *
 * <!-- See Main.java -->
 *
 * * Configure Java default logging properties if logging was not configured on the command line.
 * * Determine what kind of shell is being run (**note that this Java launcher is only thought to be used for packaged shells, so
 * this code may be redundant), and put a `inonit.script.jsh.launcher.Shell` instance in the `jsh.launcher.shell` system property.
 * This instance contains information about the locations of Rhino, the packaged file (if any), and the shell home (if any). The
 * shell is determined by checking for the `main.jsh.js` resource in the classloader (indicating a packaged shell), and then by
 * checking whether the launcher main class was loaded from `jsh.jar` (indicating a built shell). Otherwise an unbuilt shell is
 * being run.
 * * Invoke the launcher script.
 *
 * ## The `jsh` loader
 *
 * The jsh _loader_ is a subsystem that can run in its own VM or within an isolated classloader, and which implements the execution
 * of a script.  It has two implementations: a Rhino implementation (`inonit.script.jsh.Rhino`) and a Nashorn implementation
 * (`inonit.script.jsh.Nashorn`); the entry point is chosen and executed by the launcher subsystem.
 *
 * It is documented at {@link slime.jsh.internal.loader}.
 *
 * ## Development Tools
 *
 * To execute a script in an ad-hoc built shell, execute:
 * `./jsh jrunscript/jsh/test/tools/run-in-built-shell.jsh.js <script> [arguments]`
 *
 * To execute a script in an ad-hoc packaged shell, execute:
 * `./jsh jrunscript/jsh/test/tools/run-in-built-shell.jsh.js -packaged <script> [arguments]`
 *
 * ## Testing Tools
 *
 * The `jrunscript/jsh/fixtures.ts` {@link slime.jsh.test.Script | script} provides an {@link slime.jsh.test.Exports} object that
 * provides access to several shell types, as represented by the {@link slime.jsh.test.Shells} that can be created by passing the
 * global {@link slime.fifty.test.Kit | `fifty`} object.
 */
namespace slime.jsh.internal {

}
