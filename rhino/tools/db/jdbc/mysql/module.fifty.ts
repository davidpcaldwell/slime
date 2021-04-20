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
		server: server.Exports
	}

	export type Factory = slime.loader.Product<Context,Exports>

	export namespace server {
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
			Server: any
			install: any
		}

		export type Factory = slime.loader.Product<Context,Exports>

		export type Server = {
			initialize: () => void
			start: () => void
			stop: () => void
		}
	}

	(
		function(fifty: slime.fifty.test.kit) {
			var jsh = fifty.global.jsh;
			var verify = fifty.verify;
			fifty.tests.suite = function() {
				//	TODO	fifty.jsh.file is undocumented
				var tmp = fifty.jsh.file.location();
				var installed = jsh.db.jdbc.mysql.install({
					to: tmp
				});
				var server = installed.server();
				verify(server).evaluate.property("initialize").is.type("function");
				verify(server).evaluate.property("start").is.type("function");
				verify(server).evaluate.property("stop").is.type("function");
				verify(server).evaluate.property("foo").is.type("undefined");
				server.initialize();
				server.start();
				server.stop();
				jsh.shell.console("tmp = " + tmp);
			}
		}
	//@ts-ignore
	)(fifty)
}