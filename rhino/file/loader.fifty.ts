//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.internal.loader {
	export interface Context {
		library: {
			Location: {
				relative: slime.jrunscript.file.Exports["Location"]["directory"]["relativePath"]

				file: {
					exists: slime.jrunscript.file.Exports["Location"]["file"]["exists"]
				}
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Resource extends slime.jrunscript.runtime.Resource {
		name: string
	}

	export interface Exports {
		create: (root: slime.jrunscript.file.Location) => slime.runtime.loader.Synchronous<Resource>
	}
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
