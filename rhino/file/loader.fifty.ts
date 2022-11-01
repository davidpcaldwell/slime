//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.internal.loader {
	export interface Context {
		library: {
			Location: {
				relative: slime.jrunscript.file.Exports["world"]["Location"]["relative"]

				file: {
					exists: slime.jrunscript.file.Exports["world"]["Location"]["file"]["exists"]
				}
			}
		}
	}

	export interface Resource extends slime.jrunscript.runtime.Resource {
		name: string
	}

	export interface Exports {
		create: (root: slime.jrunscript.file.world.Location) => slime.runtime.loader.Synchronous<Resource>
	}

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
