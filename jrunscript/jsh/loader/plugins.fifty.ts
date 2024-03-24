//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	TODO	describe the directory format for plugins
//	TODO	remove the limitation that only script-only plugins may be deployed as directories; learn to compile the
//			Java in plugins at runtime (basically, create a way to embed the logic of slime.jsh.js into the shell).
//	TODO	decide whether the above task is already done; we do compile at runtime now, right?
/**
 * A `jsh` _plugin_ can modify a local `jsh` installation to add or modify existing functionality. As a matter of design philosophy,
 * the plugin architecture allows plugins enormous freedom to modify the existing installation, rather than restricting plugins to a
 * narrow, safe set of modifications.
 *
 * ## Types
 *
 * jsh allows authors to add local extensions to jsh. These plugins are, by default, found in the `plugins` subdirectory of the
 * installation and in the `$HOME/.jsh` directory. There are two types of plugins:
 *
 * * **Java-only**: A Java-only plugin adds Java classes to the script's execution environment, but does not otherwise modify the
 * shell.
 * * **Slime**: A scripting plugin can add JavaScript objects to the shell, as well as adding Java classes. The Java classes may be
 * used in implementing the given JavaScript objects, but will also be available to scripts.
 *
 * ## Structure
 *
 * ### Java-only
 *
 * Java-only plugins are deployed as simple `.jar` files, and can be installed by simply dropping a `.jar` file into the plugins
 * directory.
 *
 * ### Slime
 *
 * A Slime plugin can contain both JavaScript and Java code. Any Slime plugin can be deployed as a `.slime` file. `.slime` files can
 * be built using the `slime.jsh.js` script found in the `tools` subdirectory of the jsh installation.
 *
 * A Slime plugin must contain a `plugin.jsh.js` file at its top level. This file contains JavaScript code which uses the interface
 * described below.
 */
namespace slime.jsh.plugin {
	export interface $slime extends slime.jsh.loader.internal.Runtime {
		getSystemProperty(name: string): string
		getEnvironment(): slime.jrunscript.native.inonit.system.OperatingSystem.Environment
		getInvocation(): slime.jrunscript.native.inonit.script.jsh.Shell.Invocation

		getPackaged(): slime.jrunscript.native.inonit.script.jsh.Shell.Packaged

		/**
		 * Returns a `java.io.File` representing a file location relative to the `jsh` library location.
		 *
		 * @param path A relative path.
		 */
		getLibraryFile: (path: string) => slime.jrunscript.native.java.io.File
		getInterface(): slime.jrunscript.native.inonit.script.jsh.Shell.Interface
		getSystemProperties(): slime.jrunscript.native.java.util.Properties
		getStdio(): Stdio
	}

	export interface $slime extends slime.jsh.loader.internal.Runtime {
		plugins: {
			/**
			 * Loads a single plugin from the given loader, and applies it to the mock objects given in the argument (or real objects if
			 * mocks are not provided), returning the modified objects for inspection by tests.
			 *
			 * @param p Scope objects to use when loading the plugin, and a definition of the plugin itself.
			 * @returns objects affected by plugin loading, for evaluation
			 */
			mock: (p: Partial<Omit<slime.jsh.plugin.Scope,"$loader">> & { $loader: slime.old.Loader, source?: () => string }) => Pick<slime.jsh.plugin.Scope,"global"|"jsh"|"plugins">
		}
	}

	export interface Declaration {
		/**
		 * (optional) A function that returns `true` if this plugin is ready to be loaded. This function should return `false` if
		 * the plugin's dependencies are not available. If absent, the plugin is assumed to be ready to be loaded.
		 *
		 * @returns `true` to indicate all of the plugin's dependencies are available; `false` otherwise.
		 */
		isReady?: () => boolean

		disabled?: () => string

		/**
		 * A function that loads the plugin.
		 */
		load: () => void
	}

	/**
	 * The scope available to `jsh` plugins when they are running. The properties of this object may be accessed using unqualified
	 * names within a plugin definition source file.
	 */
	export interface Scope {
		/**
		 * A namespace plugins can use for inter-plugin communication; a plugin can add properties to this object that other plugins
		 * depend on and/or use.
		 */
		plugins: { [x: string]: any }

		/**
		 * Used to specify a plugin to be loaded.
		 *
		 * @param p An object specifying the plugin.
		 */
		plugin: (p: Declaration) => void

		/**
		 * The SLIME Java-enabled runtime which exposes SLIME internals to embeddings. Most plugins will not need to use this.
		 */
		$slime: slime.jsh.plugin.$slime

		/**
		 * The existing global object. Allows a plugin to define a new top-level object that will be available to scripts.
		 *
		 * Properties of this object (other than `jsh`) are currently undocumented and subject to change without notice; usage of,
		 * or modification of, these properties is strongly discouraged.
		 */
		global: object & {
			jsh: slime.jsh.Global
		}

		/**
		 * The existing `jsh` object, containing jsh modules that have been loaded so far. Plugins may add to this object.
		 */
		jsh: slime.jsh.Global

		/**
		 * An object that allows this plugin to load code, relative to the plugin's location.
		 */
		$loader: slime.old.Loader & {
			/**
			 * An object representing the classpath visible to scripts.
			 */
			classpath: {
				/**
				 * Adds a particular location to the script classpath.
				 *
				 * @param pathname A `Pathname` containing classes to add to the script classpath.
				 */
				add: (pathname: slime.jrunscript.file.Pathname) => void
			}

			/**
			 * Allows a parent plugin to load a "child" `jsh` plugin from the given child location. This call does not establish a
			 * parent-child relationship between the plugins; the plugin at the given path is simply added to the list of plugins in
			 * the shell and will be loaded when (and if) it is ready. This ability allows a "parent" plugin to contain the source
			 * code for several "child" plugins and add them to the shell plugin search directly (shells do not search the child
			 * folders of a `jsh` plugin for other plugins).
			 *
			 * @param path A path relative to the parent plugin.
			 */
			plugin: (path: string) => void
		}
	}

	/**
	 * @deprecated Replaced by {@link Scope["plugin"]}.
	 */
	export type plugin = Scope["plugin"];

	/**
	 * @deprecated Replaced by {@link Scope["plugins"]}.
	 */
	export type plugins = Scope["plugins"]

	export interface Stdio {
		getStandardInput(): slime.jrunscript.native.java.io.InputStream
		getStandardOutput(): slime.jrunscript.native.java.io.PrintStream
		getStandardError(): slime.jrunscript.native.java.io.PrintStream
	}
}

namespace slime.jsh.loader.internal.plugins {
	export interface Plugin {
		source: () => string
		implementation: Required<slime.jsh.plugin.Declaration>
	}

	export type register = (p: {
		scope: Pick<slime.jsh.plugin.Scope,"plugins"|"$slime"|"global"|"jsh">
		$loader: slime.old.Loader
		source: () => string
	}) => Plugin[]

	export type LoaderSource = { loader: slime.old.Loader }
	export type SlimeSource = { slime: any }
	export type JarSource = { jar: any }
	export type Source = LoaderSource | SlimeSource | JarSource

	export interface SourceContent {
		source?: {
			loader: slime.old.Loader
			from: () => string
		}
		classes?: slime.jrunscript.runtime.ClasspathEntry
	}

	export interface PluginsContent {
		plugins: slime.jsh.loader.internal.plugins.Plugin[]
		classpath: slime.jrunscript.runtime.ClasspathEntry[]
	}

	export type OldLoaderPlugins = { loader: slime.old.Loader }
	export type JavaFilePlugins = { _file: slime.jrunscript.native.java.io.File }
	export type ZipFilePlugins = { zip: { _file: slime.jrunscript.native.java.io.File } }
	export type SynchronousLoaderPlugins = { synchronous: slime.runtime.loader.Synchronous<any> }
	export type Plugins = OldLoaderPlugins | JavaFilePlugins | ZipFilePlugins | SynchronousLoaderPlugins

	export interface Export {
		/**
		 * Loads plugins from the given location and applies them to the current shell.
		 *
		 * @param p if a {@link SynchronousLoaderPlugins}, {@link OldLoaderPlugins} or {@link JavaFilePlugins}, scans the given location for plugins and loads them. If a
		 * {@link ZipFilePlugins}, adds the contents of the given ZIP file to the Java classpath; does not interpret the file as a
		 * JavaScript plugin or scan the file contents for JavaScript plugins.
		 */
		load: (p: Plugins) => void

		mock: slime.jsh.plugin.$slime["plugins"]["mock"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			/**
			 * Creates a new unbuilt shell, copies a plugin into an arbitrary location, and ensures the plugin is loaded.
			 */
			fifty.tests.unbuiltShell = function() {
				//	TODO	this dance should be covered by a jsh.test API
				var src = jsh.shell.jsh.src;
				var copied = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
				copied.directory.remove();
				src.copy(copied,{
					filter: function(p) {
						if (p.entry.path == "local/") return false;
						return true;
					}
				});

				var evaluate = function(result) {
					jsh.shell.console("string = " + result.stdio.output);
					return JSON.parse(result.stdio.output);
				};

				//	Add JDK 17 to shell so it can be bootstrapped
				$api.fp.world.Sensor.now({
					sensor: jsh.shell.subprocess.question,
					subject: {
						command: "bash",
						arguments: $api.Array.build(function(rv: string[]) {
							rv.push(copied.directory.getRelativePath("jsh").toString());
							rv.push("--add-jdk-17");
						})
					}
				});

				jsh.shell.console("Bootstrapping JDK 17 shell ...");
				$api.fp.world.Sensor.now({
					sensor: jsh.shell.subprocess.question,
					subject: {
						command: "bash",
						arguments: $api.Array.build(function(rv: string[]) {
							rv.push(copied.directory.getRelativePath("jsh").toString());
							rv.push(copied.directory.getRelativePath("jrunscript/jsh/test/jsh-data.jsh.js").toString());
						}),
						environment: function(is) {
							return $api.Object.compose(is, {
								JSH_LAUNCHER_JDK_HOME: copied.directory.getRelativePath("local/jdk/17").toString()
							});
						}
					}
				});

				jsh.shell.console("Copying plugin to source tree ...");
				src.getFile("jrunscript/jsh/loader/test/unbuilt-shell-plugins/copy-as-plugin.jsh.js").copy(copied.directory.getRelativePath("foo/plugin.jsh.js"), { recursive: true });
				var shouldLoad = jsh.shell.jsh({
					shell: copied.directory,
					script: copied.directory.getFile("jrunscript/jsh/loader/test/unbuilt-shell-plugins/output-plugin.jsh.js"),
					stdio: {
						output: String
					},
					evaluate: evaluate
				});
				verify(shouldLoad).evaluate.property("unbuilt-shell-plugins").is(true);

				jsh.shell.console("Copying plugin to local/ tree ...");
				copied.directory.getFile("foo/plugin.jsh.js").move(copied.directory.getRelativePath("local/foo/plugin.jsh.js"), { recursive: true });
				var shouldNotLoad = jsh.shell.jsh({
					shell: copied.directory,
					script: copied.directory.getFile("jrunscript/jsh/loader/test/unbuilt-shell-plugins/output-plugin.jsh.js"),
					stdio: {
						output: String
					},
					evaluate: evaluate
				});
				verify(shouldNotLoad).evaluate.property("unbuilt-shell-plugins").is(void(0));
			};

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.unbuiltShell);
			};

			fifty.tests.manual = {};

			fifty.tests.manual.tools = function() {
				verify(1).is(1);
				verify(jsh).tools.git.is.type("object");

				var getJenkins = function() {
					return jsh.tools.jenkins;
				};

				verify(getJenkins()).is.type("undefined");

				var jenkins = jsh.tools.plugin.jenkins();

				verify(getJenkins()).is.type("object");
				verify(jenkins).is.type("object");
				verify(jenkins).is(getJenkins());
			}
		}
	//@ts-ignore
	)(fifty);
}
