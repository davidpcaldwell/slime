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

		export type Credentials = (url: string) => {
			user: string
			token: string
		};

		export interface Request {
			method: "GET"
			url: string
			credentials?: Credentials
		}
	}

	export interface JobSummary {
		_class: string
		name: string
		url: string
		color: string
	}

	export interface Server {
		jobs: JobSummary[]
	}

	export interface Job {
	}

	export namespace server {
	}

	export interface Exports {
		Server: new (o: {}) => {}

		Credentials: {
			list: (p: { server: string, use: { user: string, token: string } }[]) => api.Credentials
		}

		url: (p: {
			server: api.Server
			path: string
		}) => string

		getVersion: (server: api.Server) => string

		request: {
			json: <R>(p: api.Request) => R
		}

		client: (p: api.Credentials) => {
			request: (p: {
				method: api.Request["method"]
				url: string
			}) => {
				json: <R>() => R
			}

			fetch: {
				(job: JobSummary): Job
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

			var server: api.Server = {
				url: jsh.shell.environment["JENKINS_SERVER"]
			};

			var credentials: api.Credentials = (url: string) => {
				return {
					user: jsh.shell.environment["JENKINS_USER"],
					token: jsh.shell.environment["JENKINS_TOKEN"]
				}
			};

			fifty.tests.manual.root.raw = function() {
				var response = subject.request.json({
					method: "GET",
					url: subject.url({
						server: server,
						path: "api/json"
					}),
					credentials: credentials
				});
				jsh.shell.console(JSON.stringify(response, void(0), 4));
			};

			fifty.tests.manual.root.bound = function() {
				var client = subject.client(credentials);

				var response = client.request({
					method: "GET",
					url: server.url
				}).json();

				jsh.shell.console(JSON.stringify(response, void(0), 4));
			};

			fifty.tests.manual.getVersion = function() {
				var version = subject.getVersion(server)

				jsh.shell.console("[" + version + "]");
			};
		}
	//@ts-ignore
	)(fifty);


	export type Script = slime.loader.Script<Context,Exports>
}
