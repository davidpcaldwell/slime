//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.tools.install {
	type Exports = jsh.tools.install.module.Exports & {
		rhino: any
		tomcat: any
	};
}

namespace slime.jsh.shell.tools {
	namespace rhino {
		interface InstallCommand {
			mock?: { lib: slime.jrunscript.file.Directory, rhino: slime.jrunscript.file.File }
			local?: slime.jrunscript.file.File
			replace?: boolean
			version?: string
		}
	}

	namespace scala {
		interface Installation {
			compile: (p: {
				destination: slime.jrunscript.file.Pathname
				deprecation: boolean
				files: any[]
			}) => void

			run: (p: {
				classpath: slime.jrunscript.file.Pathname
				main: string
			}) => void
		}
	}

	interface Exports {
		rhino: {
			install: (
				p?: rhino.InstallCommand,
				events?: any
			) => void
			require: (
				p?: rhino.InstallCommand,
				events?: any
			) => void
		}
		graal: any
		tomcat: any
		ncdbg: any
		kotlin: any
		jsyaml: any
		node: (
			(
				slime.jrunscript.node.Installation & { update: () => void }
				|
				{
					install: (p?: { update?: boolean }) => void
				}
			) & {
				require: () => void
			}
		)
		javamail: {
			install: () => void
			require: () => void
		}
		jsoup: any
		postgresql: any
		scala: {
			installation: scala.Installation
		}
	}
}