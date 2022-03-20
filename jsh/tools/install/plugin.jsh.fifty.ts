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
			local?: slime.jrunscript.file.File
			replace?: boolean
			version?: string
		}
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

	export namespace node {
		export interface Managed {
			require: () => void
		}

		export interface Installed extends Managed, slime.jrunscript.node.Installation {
			update: () => void
		}

		export interface Absent extends Managed {
			install: (p?: { update?: boolean }) => void
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
		tomcat: {
			installed: any
			install: any
			require: any
			test: {
				getLatestVersion: any
			}
		}
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
		selenium: {
			/**
			 * If both the Java Selenium API and the Chrome Selenium driver are installed into the shell, loads them; otherwise,
			 * exits.
			 */
			load: () => void
		}
		node: node.Installed | node.Absent
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

	export namespace internal.tomcat {
		export interface Context {
			$api: slime.$api.Global
			jsh: slime.jsh.Global
		}

		export type Version = {}

		export interface Exports {
			installed: (
				p?: {
					mock?: {
						notes: slime.Resource
					}
					home?: slime.jrunscript.file.Directory
				}
			) => Version
			install: any
			require: any
			test: {
				getLatestVersion: any
			}
		}

		export type Script = slime.loader.Script<Context,Exports>
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const script: internal.tomcat.Script = fifty.$loader.script("plugin.jsh.tomcat.js");

			const subject = script({
				$api: fifty.global.$api,
				jsh: fifty.global.jsh
			});

			fifty.tests.world = function() {
				var version = subject.test.getLatestVersion();
				fifty.global.jsh.shell.console(version);
			}
		}
	//@ts-ignore
	)(fifty);
}
