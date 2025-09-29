//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.internal.jrunscript_environment {
	export interface Argument {
		/**
		 * The location of the source code of the shell.
		 */
		src: slime.jrunscript.file.Directory

		/**
		 * The location of a built shell, or the location at which to build a built shell. If absent, a temporary directory will be
		 * used.
		 */
		home?: slime.jrunscript.file.Pathname

		executable: boolean

		/**
		 * Indicates whether the current host is capable of pinging itself; `true` indicates it cannot.
		 */
		noselfping: boolean

		tomcat?: boolean
	}

	export interface Environment {
		jsh: {
			built: {
				readonly location: slime.jrunscript.file.Pathname;
				readonly home: slime.jrunscript.file.Directory;
				readonly data: any;
				requireTomcat(): void;
			}
			src: any
			unbuilt: any
		}
		noselfping: any
	}

	export type Exports = new (p: Argument) => Environment

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<void,Exports>
}
