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

	export namespace tomcat {
		export type Version = {
			toString(): string
		}

		export type Installation = {
			version: Version
		}

		export namespace install {
			export type Events = {
				console: string
				installed: {
					to: slime.jrunscript.file.Pathname
				}
			}
		}
	}

	export interface Exports {
		tomcat: {
			/**
			 * Returns the Tomcat installed at the
			 */
			 installed: (p?: {
				mock?: {
					notes: slime.Resource
				}
				/**
				 * If present, represents the location in which to look for the installation. Defaults to the `jsh` managed Tomcat
				 * location.
				 */
				home?: slime.jrunscript.file.Pathname
			}) => tomcat.Installation

			install: (p?: {
				mock?: {
					lib?: slime.jrunscript.file.Directory
					getLatestVersion?: () => string
					findApache?: typeof slime.jsh.Global["tools"]["install"]["apache"]["find"]
				}
				to?: slime.jrunscript.file.Pathname
				replace?: boolean
				version?: string
				local?: slime.jrunscript.file.File
			}, handler?: slime.$api.events.Handler<tomcat.install.Events>) => void

			/**
			 * If Tomcat is not installed at the target location (defined by the first parameter; see `install()`), installs it at
			 * that location using the configuration specified by the first argument.
			 */
			require: (p?: Parameters<Exports["tomcat"]["install"]>[0], handler?: Parameters<Exports["tomcat"]["install"]>[1]) => void

			test: {
				getLatestVersion: () => string
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			fifty.tests.tomcat = function() {
				var Captor = function(array,types) {
					types.forEach(function(type) {
						this[type] = function(e) {
							array.push(e);
						}
					},this);
				};

				var isType = function(name) {
					return function(e) {
						return e.type == name;
					}
				};

				var getVersionString = function(): string {
					if (!this.version) return null;
					return this.version.toString();
				};

				var Distribution = function(version) {
					var tmpdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
					var dist = tmpdir.getRelativePath("apache-tomcat-" + version).createDirectory();
					dist.getRelativePath("a").write("a", { append: false });
					dist.getRelativePath("RELEASE-NOTES").write(fifty.$loader.get("test/data/tomcat-release-notes-7.0.70.txt").read(String).replace(/7\.0\.70/g, version), { append: false });
					var rv = jsh.shell.TMPDIR.createTemporary({ suffix: ".zip" }).pathname;
					jsh.io.archive.zip.encode({
						stream: rv.write(jsh.io.Streams.binary, { append: false }),
						entries: [
							//@ts-ignore
							{ path: "apache-tomcat-" + version + "/" + "RELEASE-NOTES", resource: dist.getFile("RELEASE-NOTES") },
							//@ts-ignore
							{ path: "apache-tomcat-" + version + "/" + "a", resource: dist.getFile("a") }
						]
					});
					return rv.file;
				}

				var mock = {
					lib: jsh.shell.TMPDIR.createTemporary({ directory: true }),
					getLatestVersion: function() {
						return "7.0.99";
					},
					findApache: function(o) {
						if (o.path == "tomcat/tomcat-7/v7.0.98/bin/apache-tomcat-7.0.98.zip") return Distribution("7.0.98");
						if (o.path == "tomcat/tomcat-7/v7.0.99/bin/apache-tomcat-7.0.99.zip") return Distribution("7.0.99");
						if (o.path == "tomcat/tomcat-7/v7.0.109/bin/apache-tomcat-7.0.109.zip") return Distribution("7.0.109");
						throw new Error("Mock: " + o.path);
					}
				};

				fifty.run(function alreadyInstalled() {
					var events: slime.$api.Event<string>[] = [];
					mock.lib.getRelativePath("tomcat").createDirectory();
					jsh.shell.tools.tomcat.install({ mock: mock }, new Captor(events,["console","installed"]));
					verify(events)[0].type.is("console");
					verify(events)[0].detail.is("Tomcat already installed at " + mock.lib.getSubdirectory("tomcat"));
					mock.lib.getSubdirectory("tomcat").remove();
				});

				fifty.run(function install() {
					var events: slime.$api.Event<string>[] = [];
					jsh.shell.tools.tomcat.install({ mock: mock }, new Captor(events,["console","installed"]));
					verify(events)[0].type.is("console");
					jsh.shell.console(events[1].detail);
					verify(events)[1].evaluate(function() { return /^Unzipping (?:[a-zA-Z0-9\/\._]+) to\:(.*)$/.test(this.detail); }).is(true);
					verify(mock.lib).getSubdirectory("tomcat").getFile("a").is.type("object");
					verify(mock.lib).getSubdirectory("tomcat").getFile("b").is.type("null");
					var installed = jsh.shell.tools.tomcat.installed({ home: mock.lib.getRelativePath("tomcat") });
					var version = installed.version.toString();
					verify(version).is("7.0.109");
					mock.lib.getSubdirectory("tomcat").remove();
				});

				fifty.run(function replace() {
					jsh.shell.tools.tomcat.install({ mock: mock, version: "7.0.98" });
					var installed = jsh.shell.tools.tomcat.installed({ home: mock.lib.getRelativePath("tomcat") });
					verify(installed).evaluate(getVersionString).is("7.0.98");

					var noreplace = [];
					jsh.shell.tools.tomcat.install({ mock: mock }, new Captor(noreplace,["installed"]));
					installed = jsh.shell.tools.tomcat.installed({ home: mock.lib.getRelativePath("tomcat") });
					verify(installed).evaluate(getVersionString).is("7.0.98");
					verify(noreplace).length.is(0);

					var replace = [];
					jsh.shell.tools.tomcat.install({ mock: mock, replace: true }, new Captor(replace,["installed"]));
					installed = jsh.shell.tools.tomcat.installed({ home: mock.lib.getRelativePath("tomcat") });
					verify(installed).evaluate(getVersionString).is("7.0.109");
					verify(replace).length.is(1);

					mock.lib.getSubdirectory("tomcat").remove();
				});
			}
		}
	//@ts-ignore
	)(fifty);


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
			 * Loads the Selenium Java API if it is present; otherwise, throws an exception. If the Chrome Selenium driver is
			 * installed into the shell, the API will be configured to use it.
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

		export type Exports = slime.jsh.shell.tools.Exports["tomcat"]

		export type Script = slime.loader.Script<Context,Exports>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const script: internal.tomcat.Script = fifty.$loader.script("plugin.jsh.tomcat.js");

			const subject = script({
				$api: fifty.global.$api,
				jsh: fifty.global.jsh
			});

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.tomcat);
			}

			fifty.tests.world = function() {
				var version = subject.test.getLatestVersion();
				fifty.global.jsh.shell.console(version);
			}
		}
	//@ts-ignore
	)(fifty);
}
