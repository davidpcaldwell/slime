//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.internal.jrunscript_environment {
	export interface Context {
	}

	export interface Argument {
		src: slime.jrunscript.file.Directory
		home: slime.jrunscript.file.Pathname
		executable: boolean
		noselfping: true
		tomcat: boolean
	}

	export interface Environment {
	}

	export type Exports = new (p: Argument) => Environment

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
