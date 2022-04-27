//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.openapi {
	export interface Context {
		library: {
			shell: slime.jrunscript.shell.Exports
		}
	}

	export interface Configuration {
		src: slime.jrunscript.file.Directory
		node: slime.jrunscript.node.Installation
	}

	export interface Parameters {
		config: slime.jrunscript.file.File
		specification: {
			url: string
		}
		destination: slime.jrunscript.file.Pathname
	}

	export interface Exports {
		initialize: (jsh: slime.jsh.Global) => Configuration
		generate: (p: Parameters & {
			configuration: Configuration
		}) => void
	}

	export interface Plugin {
		//	TODO	world-oriented
		generate: (p: Parameters) => void
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
