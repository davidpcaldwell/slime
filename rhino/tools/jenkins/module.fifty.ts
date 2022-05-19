//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.jenkins {
	export interface Context {
		library: {
			http: slime.jrunscript.http.client.Exports
			document: any
		}
	}

	export namespace api {
		export interface Server {
			/**
			 * The base URL of the server, including the trailing `/`.
			 */
			url: string
		}

		export interface Request {
			method: "GET"
			url: string
			credentials?: (url: string) => {
				user: string
				token: string
			}
		}
	}

	export interface Server {
		jobs: server.Job[]
	}

	export namespace server {
		export interface Job {
			_class: string
			name: string
			url: string
			color: string
		}
	}

	export interface Exports {
		Server: new (o: {}) => {}

		url: (p: {
			server: api.Server
			path: string
		}) => string

		getVersion: (server: api.Server) => string

		request: {
			json: <R>(p: api.Request) => R
		}

		server: (p: api.Server) => {
			getVersion: () => string

			credentials: (p: api.Request["credentials"]) => {
				request: (p: {
					method: api.Request["method"]
					path: string
				}) => {
					json: <R>() => R
				}
			}
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

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			const subject = (function() {
				const script: Script = fifty.$loader.script("module.js");
				return script({
					library: {
						http: jsh.http,
						document: void(0)
					}
				})
			})();

			fifty.tests.manual = fifty.test.Parent();

			fifty.tests.manual.root = fifty.test.Parent();

			fifty.tests.manual.root.raw = function() {
				var response = subject.request.json({
					method: "GET",
					url: subject.url({
						server: {
							url: jsh.shell.environment["JENKINS_SERVER"]
						},
						path: "api/json"
					}),
					credentials: () => {
						return {
							user: jsh.shell.environment["JENKINS_USER"],
							token: jsh.shell.environment["JENKINS_TOKEN"]
						}
					}
				});
				jsh.shell.console(JSON.stringify(response, void(0), 4));
			};

			fifty.tests.manual.root.bound = function() {
				var server = subject.server({
					url: jsh.shell.environment["JENKINS_SERVER"]
				}).credentials(() => {
					return {
						user: jsh.shell.environment["JENKINS_USER"],
						token: jsh.shell.environment["JENKINS_TOKEN"]
					}
				});

				var response = <slime.jrunscript.tools.jenkins.Server>server.request({
					method: "GET",
					path: "/"
				}).json();

				jsh.shell.console(JSON.stringify(response, void(0), 4));
			};

			fifty.tests.manual.getVersion = function() {
				var server = subject.server({
					url: jsh.shell.environment["JENKINS_SERVER"]
				});

				jsh.shell.console("[" + server.getVersion() + "]");
			};
		}
	//@ts-ignore
	)(fifty);


	export type Script = slime.loader.Script<Context,Exports>
}
