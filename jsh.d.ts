/**
 * `jsh` is a shell environment which allows JavaScript programs to be written which execute in the Java virtual machine and thus
 * can interact with Java platform classes and libraries written in Java or other JVM languages.
 *
 * `jsh` scripts have access to the global `jsh` object, which is of type {@link Global}.
 *
 * See [running `jsh`](../src/jsh/launcher/api.html) for information about how to run scripts using `jsh` and configure the
 * shell.
 *
 * See [old JSAPI-based `jsh` documentation](../src/jsh/etc/api.html).
 */
namespace slime.jsh {
	namespace db.jdbc {
		interface Exports {
			//	interface is built out via Declaration Merging (https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
		}
	}

	/**
	 * The global `jsh` object provided by the `jsh` shell.
	 *
	 * All code loaded by `jsh` also has access to the `$api` global object; see [$api](slime._api.global.html).
	 */
	interface Global {
		java: slime.jrunscript.host.Exports & {
			tools: any,
			log: any
		}

		http: slime.jrunscript.http.client.Exports

		tools: {
			git: slime.jrunscript.git.Exports
			hg: any
			node: slime.jrunscript.node.Exports
			install: slime.jsh.tools.install.Exports
			github: slime.jrunscript.tools.github.Exports
			gradle: any
		} & {
			//	deprecated
			rhino: {}
			tomcat: {}
			ncdbg: {}
		}

		script: slime.jsh.script.Exports

		shell: slime.jsh.shell.Exports & {
			/** @deprecated */
			getopts: jsh["script"]["getopts"]
		}

		unit: {
			mock: slime.jsh.unit.mock;
			html: any
			Suite: any
			interface: any
			$slime: slime.jsh.plugin.$slime
			jsapi: any
			Verify: slime.definition.unit.Verify.Factory
			fifty: {
				/**
				 * Creates a Part that can be used in a jsapi test suite from a Fifty test file.
				 */
				Part: (p: {
					/**
					 * The shell in which to run Fifty.
					 */
					shell: slime.jrunscript.file.Directory

					/**
					 * The `loader/api/test/fifty/test.jsh.js` script.
					 */
					script: slime.jrunscript.file.File

					/**
					 * The Fifty test file to run.
					 */
					file: slime.jrunscript.file.File
				}) => any
			}
			JSON: {
				Encoder: any
			}
		}

		loader: {
			/**
			 * Loads `jsh` plugins from a given location.
			 */
			plugins: (p: slime.jrunscript.file.Directory | slime.jrunscript.file.Pathname | slime.Loader) => void
			run: any
			file: any
			addFinalizer: any
			java: any
			module: any
			worker: any
		}
		js: any
		document: any
		file: slime.jrunscript.file.Exports
		time: slime.time.Exports
		ip: slime.jrunscript.ip.Exports
		httpd: slime.jsh.httpd.Exports
		db: {
			jdbc: slime.jsh.db.jdbc.Exports
		}
	}
}
