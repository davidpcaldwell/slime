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

		$slime: slime.jsh.plugin.$slime

		global: object

		jsh: any

		$loader: any
	}
}

namespace slime.jsh.loader.internal.plugins {
	export interface Export {
		mock: (p: {
			global?: { [x: string]: any }
			jsh?: { [x: string]: any }
			plugins?: { [x: string]: any }
			$loader: slime.Loader
			$slime?: slime.jsh.plugin.$slime

			toString?: any
		}) => {
			global: { [x: string]: any },
			jsh: { [x: string]: any },
			plugins: { [x: string]: any }
		}

		load: {
			(p: {
				_file?: slime.jrunscript.native.java.io.File
				loader?: slime.Loader
				zip?: {
					_file: slime.jrunscript.native.java.io.File
				}
			}): void
		}
	}
}
