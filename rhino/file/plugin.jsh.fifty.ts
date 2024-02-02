//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	export interface Plugin extends Exports {
		jsh: {
			plugins: (location: slime.jrunscript.file.Location) => void

			plugin: {
				/**
				 * This experimental API automates a common workflow for scripts loading addiitional `jsh` plugins; it allows a
				 * script to load a plugin and obtain a reference to it in one step.
				 *
				 * @template G The type of the global object in the application
				 * @template P The type of the plugin
				 *
				 * @param p
				 * @returns
				 *
				 * @experimental
				 */
				load: <G,P>(p: {
					/**
					 * The location from which to load the plugin.
					 */
					from: slime.jrunscript.file.Location

					/**
					 * An identity function that has the type of the global object. This has no effect at runtime, but provides
					 * type information for the `plugin` argument.
					 */
					global: slime.$api.fp.Identity<G>

					/**
					 * A function that obtains the loaded plugin from the global object after it has been loaded.
					 */
					plugin: (global: G) => P
				}) => P
			}
		}
	}
}
