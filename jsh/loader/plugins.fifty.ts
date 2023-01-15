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
 * A jsh plugin can modify a local jsh installation to add or modify existing functionality. As a matter of design philosophy, the
 * plugin architecture allows plugins enormous freedom to modify the existing installation, rather than restricting plugins to a
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
		$loader: slime.Loader & {
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
	export type register = (p: {
		plugins: slime.jsh.plugin.Scope["plugins"]
		toString: () => string
		mock?: {
			$slime: slime.jsh.plugin.$slime
			global: slime.jsh.plugin.Scope["global"]
			jsh?: slime.jsh.Global
		}
		$loader: slime.Loader
	}) => slime.jsh.plugin.Declaration[]

	export type LoaderPlugins = { loader: slime.old.Loader }
	export type JavaFilePlugins = { _file: slime.jrunscript.native.java.io.File }
	export type ZipFilePlugins = { zip: { _file: slime.jrunscript.native.java.io.File } }
	export type Plugins = LoaderPlugins | JavaFilePlugins | ZipFilePlugins

	export type LoaderSource = { loader: slime.Loader }
	export type SlimeSource = { slime: any }
	export type JarSource = { jar: any }
	export type Source = LoaderSource | SlimeSource | JarSource

	export interface Export {
		mock: (p: {
			global?: slime.jsh.plugin.Scope["global"]
			jsh?: slime.jsh.plugin.Scope["jsh"]
			plugins?: slime.jsh.plugin.Scope["plugins"]
			$loader: slime.Loader
			$slime?: slime.jsh.plugin.$slime

			toString?: any
		}) => {
			global: slime.jsh.plugin.Scope["global"]
			jsh: slime.jsh.plugin.Scope["jsh"]
			plugins: slime.jsh.plugin.plugins
		}

		/**
		 *
		 * @param p if a {@link ZipFilePlugins}, adds the contents of the given ZIP file to the Java classpath; does not interpret the file as a JavaScript plugin or
		 * scan the file contents for JavaScript plugins.
		 */
		load: (p: Plugins) => void
	}
}
