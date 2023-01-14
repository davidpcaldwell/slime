//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.plugin {
	export interface Declaration {
		isReady?: () => boolean
		disabled?: () => string
		load: () => void
	}

	export type plugin = (p: Declaration) => void;

	export type plugins = { [x: string]: any }

	/**
	 * The scope available to `jsh` plugins when they are running. The properties of this object may be accessed using unqualified
	 * names within a plugin.
	 */
	export interface Scope {
		/**
		 * A namespace plugins can use for inter-plugin communication; a plugin can add properties to this object that other plugins
		 * depend on and/or use.
		 */
		plugins: plugins

		plugin: plugin

		/**
		 * The SLIME Java-enabled runtime which exposes SLIME internals to embeddings. Most plugins will not need to use this.
		 */
		$slime: slime.jsh.plugin.$slime

		global: object & {
			jsh: slime.jsh.Global
		}

		jsh: slime.jsh.Global

		$loader: any
	}
}

namespace slime.jsh.loader.internal.plugins {
	export type load = (p: {
		plugins: slime.jsh.plugin.plugins
		toString: () => string
		mock?: {
			$slime: slime.jsh.plugin.$slime
			global: slime.jsh.plugin.Scope["global"]
			jsh?: slime.jsh.Global
		}
		$loader: slime.Loader
	}) => slime.jsh.plugin.Declaration[]

	export interface Export {
		mock: (p: {
			global?: slime.jsh.plugin.Scope["global"]
			jsh?: slime.jsh.plugin.Scope["jsh"]
			plugins?: slime.jsh.plugin.plugins
			$loader: slime.Loader
			$slime?: slime.jsh.plugin.$slime

			toString?: any
		}) => {
			global: slime.jsh.plugin.Scope["global"]
			jsh: slime.jsh.plugin.Scope["jsh"]
			plugins: slime.jsh.plugin.plugins
		}

		load: {
			(p: {
				loader: slime.Loader
			}): void

			(p: {
				_file: slime.jrunscript.native.java.io.File
			}): void

			/**
			 * Adds the contents of the given ZIP file to the Java classpath. Does not interpret the file as a JavaScript plugin or
			 * scan the file contents for JavaScript plugins.
			 */
			(p: {
				zip?: {
					_file: slime.jrunscript.native.java.io.File
				}
			}): void
		}
	}
}
