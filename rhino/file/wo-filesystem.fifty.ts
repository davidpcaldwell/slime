//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.exports {
	export interface Filesystem {
		/**
		 * Copies a filesystem node to a given location, creating the location's parent folders as necessary.
		 */
		copy: slime.$api.fp.world.Means<
			{
				filesystem: world.Filesystem
				from: string
				to: string
			},
			{
				/**
				 * Fired when a directory is created.
				 */
				created: string
			}
		>

		/**
		 * Moves a filesystem node to a given location, creating the location's parent folders as necessary.
		 */
		move: slime.$api.fp.world.Means<
			{
				filesystem: world.Filesystem
				from: string
				to: string
			},
			{
				/**
				 * Fired when a directory is created.
				 */
				created: string
			}
		>
	}
}


namespace slime.jrunscript.file.internal.wo.filesystem {
	export interface Context {
		ensureParent: slime.$api.fp.world.Means<slime.jrunscript.file.Location, { created: slime.jrunscript.file.Location }>
	}

	export type Exports = slime.jrunscript.file.exports.Filesystem;

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
