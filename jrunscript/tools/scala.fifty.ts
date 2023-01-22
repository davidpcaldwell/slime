//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.scala {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
		}
	}

	export interface Installation {
		base: string
	}

	export interface Exports {
		Installation: {
			getVersion: slime.$api.fp.world.Question<scala.Installation,void,slime.$api.fp.Maybe<string>>

			compile: (installation: scala.Installation) => slime.$api.fp.world.Action<{
				destination: slime.jrunscript.file.Pathname
				deprecation: boolean
				files: any[]
			},slime.jrunscript.shell.run.TellEvents>

			run: (installation: scala.Installation) => slime.$api.fp.world.Action<{
				deprecation: boolean
				classpath: slime.jrunscript.file.Pathname
				main: string
			},slime.jrunscript.shell.run.TellEvents>
		}
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
