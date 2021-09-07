//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	TODO	note that this test file is not included in the global SLIME test suite

namespace slime.jrunscript {
	export interface Packages {
		com: {
			mysql: any
		}
	}
}

namespace slime.jrunscript.db.mysql {
	export interface Context {
		jdbc: {
			types: any
			DataSource: any
			Identifier: any
			Database: any
			Catalog: any
			Schema: any
			Context: any
			Table: any
		}
		library: {
			java: slime.jrunscript.host.Exports
			shell: {
				run: slime.jrunscript.shell.Exports["run"]
				console(message: string)
				os: {
					name: string
				}
			}
		}
	}

	export interface Exports {
		jdbc: any
		Catalog: any
		Database: any
		local: local.Exports
	}

	export type Factory = slime.loader.Product<Context,Exports>

	export namespace client {
		export type Server = {
			host: string
			port?: number
			database?: string
		}

		export type Credentials = {
			user: string
			password?: string
		}

		export type Client = {
			command: (p: Server & Credentials & {
				execute?: string
			}) => slime.jrunscript.shell.invocation.old.Argument
		}
	}

	export namespace server {
		export type Server = {
			initialize: () => void
			start: () => void
			stop: () => void
		}
	}

	export namespace local {
		export interface Context {
			library: {
				java: slime.jrunscript.host.Exports
				shell: {
					run: slime.jrunscript.shell.Exports["run"]
					console(message: string)
					os: {
						name: string
					}
				}
			}
		}

		export interface Exports {
			Server: (p: {
				base: slime.jrunscript.file.Directory
				port?: number
				data?: slime.jrunscript.file.Pathname
			}) => server.Server

			Client: (p: {
				program: slime.jrunscript.file.File
			}) => client.Client
		}

		export type Factory = slime.loader.Product<Context,Exports>
	}

	(
		function(fifty: slime.fifty.test.kit) {
			var jsh = fifty.global.jsh;
			var verify = fifty.verify;
			fifty.tests.suite = function() {
				//	TODO	fifty.jsh.file is undocumented
				var tmp = fifty.jsh.file.location();
				var port = jsh.ip.getEphemeralPort();
				var installed = jsh.db.jdbc.mysql.install({
					to: tmp
				});
				verify(installed).is.type("object");
				var server = installed.server({
					port: port.number
				});
				verify(installed).is.type("object");
				verify(server).evaluate.property("initialize").is.type("function");
				verify(server).evaluate.property("start").is.type("function");
				verify(server).evaluate.property("stop").is.type("function");
				verify(server).evaluate.property("foo").is.type("undefined");
				server.initialize();
				server.start();

				var client = installed.client();

				var command = client.command({
					host: "127.0.0.1",
					port: port.number,
					user: "root",
					execute: "show databases"
				});

//				jsh.shell.console(JSON.stringify(command));

				jsh.shell.run(command);

				server.stop();
				jsh.shell.console("tmp = " + tmp);
			}
		}
	//@ts-ignore
	)(fifty)
}