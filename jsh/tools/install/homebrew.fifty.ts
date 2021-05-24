//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.tools.install.module {
	export interface Homebrew {
		directory: slime.jrunscript.file.Directory
		update: () => void
		install: (p: { formula: string }) => void
		upgrade: (p: { formula: string }) => void
	}

	export namespace homebrew {
		export interface Exports {
			get: (p: { location: slime.jrunscript.file.Pathname }) => Homebrew
		}

		export type Factory = slime.loader.Product<{},homebrew.Exports>
	}

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

