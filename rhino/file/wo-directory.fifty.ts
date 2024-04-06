//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.internal.wo.directory {
	export interface Context {
		Location: slime.jrunscript.file.internal.loader.Context["library"]["Location"]
		Location_relative: slime.jrunscript.file.exports.Location["directory"]["relativePath"]
		Location_directory_exists: ReturnType<slime.jrunscript.file.Exports["Location"]["directory"]["exists"]["world"]>
		ensureParent: slime.$api.fp.world.Means<slime.jrunscript.file.Location, { created: string }>
		remove: slime.$api.fp.world.Means<slime.jrunscript.file.Location,void>
	}

	export type Exports = slime.jrunscript.file.exports.location.Directory

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
