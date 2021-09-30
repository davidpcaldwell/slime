//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.homebrew {
	export interface Installation {
		directory: slime.jrunscript.file.Directory
		update: () => void
		install: (p: { formula: string }) => void
		upgrade: (p: { formula: string }) => void
	}

	export interface Exports {
		/**
		 * Returns a Homebrew installation at the given location, creating the directory and installing Homebrew if necessary.
		 */
		get: (p: { location: slime.jrunscript.file.Pathname }) => Installation
	}

	export type load = slime.loader.Product<void,homebrew.Exports>

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
			}
		}
	//@ts-ignore
	)(fifty);
}

