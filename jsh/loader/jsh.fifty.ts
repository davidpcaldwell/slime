namespace slime.jsh {
	export interface Global {
		loader: {
			run: any
			value: any
			file: any
			module: any
			/**
			 * Loads `jsh` plugins from a given location.
			 */
			plugins: (p: slime.jrunscript.file.Directory | slime.jrunscript.file.Pathname | slime.Loader) => void
			addFinalizer: any
			java: any
			worker: any
			kotlin: {
				/**
				 * **Experimental** Runs the given Kotlin script under the given bindings. See `jsh/test/manual/kotlin-jsr-223.jsh.js`
				 * for an example. Kotlin must first be installed via `jsh/tools/install/kotlin.jsh.js`.
				 */
				run: (
					program: slime.jrunscript.file.File,
					/**
					 * A set of bindings that will be made visible to the script.
					 */
					bindings: {
						[x: string]: any
					}
				) => any
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var verify = fifty.verify;
			var tests = fifty.tests;
			var jsh = fifty.global.jsh;

			type exports = { foo: string }

			tests.suite = function() {
				var byFullPathname: exports = jsh.loader.module(fifty.$loader.getRelativePath("test/code/module.js"));
				verify(byFullPathname).foo.is("bar");

				var byModulePathname: exports = jsh.loader.module(fifty.$loader.getRelativePath("test/code"));
				verify(byModulePathname).foo.is("bar");

				var byModuleFile: exports = jsh.loader.module(fifty.$loader.getRelativePath("test/code/module.js").file);
				verify(byModuleFile).foo.is("bar");

				var byModuleDirectory: exports = jsh.loader.module(fifty.$loader.getRelativePath("test/code").directory);
				verify(byModuleDirectory).foo.is("bar");
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.jsh.plugin {
	export interface EngineSpecific {
		//	provided by engine-specific rhino.js and nashorn.js
		exit: any
		jsh: any
	}

	export interface Stdio {
		getStandardInput(): slime.jrunscript.native.java.io.InputStream
		getStandardOutput(): slime.jrunscript.native.java.io.PrintStream
		getStandardError(): slime.jrunscript.native.java.io.PrintStream
	}

	export interface $slime extends slime.jrunscript.runtime.Exports, EngineSpecific {
		getSystemProperty(name: string): string
		getEnvironment(): slime.jrunscript.native.inonit.system.OperatingSystem.Environment
		getInvocation(): slime.jrunscript.native.inonit.script.jsh.Shell.Invocation

		getPackaged(): slime.jrunscript.native.inonit.script.jsh.Shell.Packaged

		plugins: {
			mock: slime.jsh.loader.internal.plugins.Export["mock"]
		}

		loader: slime.jrunscript.runtime.Exports["loader"] & {
			getLoaderScript(path: string): any
		}
		getLibraryFile: (path: string) => slime.jrunscript.native.java.io.File
		getInterface(): any
		getSystemProperties(): slime.jrunscript.native.java.util.Properties
		getStdio(): Stdio
	}
}