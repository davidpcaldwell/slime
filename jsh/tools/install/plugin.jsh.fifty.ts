//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/// <reference path="../../../local/jsh/lib/node/lib/node_modules/@types/js-yaml/index.d.ts" />

namespace slime.jsh.shell.tools {
	export namespace rhino {
		export interface InstallCommand {
			mock?: { lib: slime.jrunscript.file.Directory, rhino: slime.jrunscript.file.File }

			/**
			 * A local copy of the Rhino JAR file to install.
			 */
			local?: slime.jrunscript.file.File

			/**
			 * A named version of Rhino to download and install; ignored if `local` is specified. Available versions include:
			 *
			 * * mozilla/1.7.14 (the default)
			 * * mozilla/1.7R3
			 * * mozilla/1.7.12
			 * * mozilla/1.7.13
			 */
			version?: string

			/**
			 * Whether to replace the existing installation if one is found (`true`), or to leave it in place (`false`, the
			 * default).
			 */
			replace?: boolean
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
	}

	export interface Exports {
		ncdbg: any
	}

	export interface Exports {
		graal: any
	}

	export interface Exports {
		tomcat: slime.jsh.shell.tools.Tomcat
	}

	export namespace mkcert {
		export interface Installation {
			/**
			 * The location of the `mkcert` executable in this installation.
			 */
			program: slime.jrunscript.file.File

			/**
			 * Whether the root CA exists and is trusted by the system.
			 */
			isTrusted: () => boolean

			/**
			 * Creates a PKCS12 certificate pertaining to the given hosts at the given location.
			 */
			pkcs12: (p: {
				/**
				 * The list of hosts to which this certificate should pertain.
				 */
				hosts: string[]

				/**
				 * The destination path to which to generate the certificate. If omitted, `mkcert` itself will generate a path
				 * and report it to the console. If you're writing an application that's intending to use the certificate, this
				 * is probably not what you want.
				 */
				to?: slime.jrunscript.file.Pathname
			}) => void
		}
	}

	export interface Exports {
		mkcert: {
			install: (p?: { destination?: slime.jrunscript.file.Pathname, replace?: boolean }) => mkcert.Installation
			require: () => mkcert.Installation
		}
	}

	export interface Exports {
		selenium: {
			/**
			 * Loads the Selenium Java API if it is present; otherwise, throws an exception. If the Chrome Selenium driver is
			 * installed into the shell, the API will be configured to use it.
			 */
			load: () => void
		}
	}

	export interface Exports {
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
	}

	export interface Exports {
		kotlin: any
	}

	export namespace scala {
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

	export interface Exports {
		scala: {
			installation: scala.Installation
		}
	}

	export interface Exports {
		jsoup: any
	}

	export interface Exports {
		javamail: {
			install: () => void
			require: () => void
		}
	}

	export interface Exports {
		postgresql: any
	}
}

namespace slime.jsh {
	//	TODO	the need to modify slime.jsh in this plugin, as well as jsh.shell.tools, probably means a refactor is needed
	export interface Tools {
		gradle: any
	}
}

namespace slime.jsh.shell.tools {

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const script: internal.tomcat.Script = fifty.$loader.script("tomcat.js");

			const subject = script({
				$api: fifty.global.$api,
				jsh: fifty.global.jsh
			});

			fifty.tests.suite = function() {
				fifty.load("tomcat.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty);
}
