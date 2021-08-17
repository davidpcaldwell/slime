//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/// <reference path="../../../local/jsh/lib/node/lib/node_modules/@types/js-yaml/index.d.ts" />

namespace slime.jsh.tools.install {
	export type Exports = slime.jsh.tools.install.module.Exports & {
		rhino: any
		tomcat: any
	};
}

namespace slime.jsh.shell.tools {
	namespace rhino {
		export interface InstallCommand {
			mock?: { lib: slime.jrunscript.file.Directory, rhino: slime.jrunscript.file.File }
			local?: slime.jrunscript.file.File
			replace?: boolean
			version?: string
		}
	}

	namespace scala {
		export interface Installation {
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

	export namespace mkcert {
		export interface Installation {
			program: slime.jrunscript.file.File
			isTrusted: () => boolean
			pkcs12: (p: { hosts: string[], to?: slime.jrunscript.file.Pathname }) => void
		}
	}

	export interface Exports {
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

		/**
		 * Integration with [`js-yaml`](https://github.com/nodeca/js-yaml) v3, which provides support for the YAML serialization format.
		 */
		jsyaml: {
			/**
			 * Downloads `js-yaml`, installs it into the current shell, and returns it. Property is available if this shell allows
			 * the installation of libraries.
			 */
			install?: () => typeof jsyaml

			/**
			 * Returns `js-yaml`, downloading it if it is not installed in the shell. If it is not installed in the shell and *can*
			 * be installed into the shell, it will be installed into the shell.
			 */
			require: () => typeof jsyaml

			/**
			 * Downloads `js-yaml` if it is not installed into the shell, and returns it.
			 */
			load: () => typeof jsyaml
		}

		mkcert: {
			install: (p?: { destination?: slime.jrunscript.file.Pathname, replace?: boolean }) => mkcert.Installation
			require: () => mkcert.Installation
		}
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