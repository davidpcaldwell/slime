//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.jenkins {
	export interface Context {
		library: {
			http: slime.jrunscript.http.client.Exports
			document: slime.runtime.document.Exports
		}
	}

	export namespace api {
		export interface Resource {
			url: string
		}

		/**
		 * Descriptor for a remote server.
		 */
		export interface Server extends Resource {
			/**
			 * The base URL of the server, including the trailing `/`.
			 */
			url: string
		}

		export interface Credentials {
			user: string
			token: string
		}

		export interface Request {
			method: "GET"
			url: string
			credentials?: Credentials
		}
	}

	export interface Api {
	}

	export interface Exports {
		api: Api
	}

	export interface Job extends api.Resource {
		_class: string
		name: string
		url: string
		color: string
	}

	export interface Api {
		Job: {
			isName: (name: string) => slime.$api.fp.Predicate<slime.jrunscript.tools.jenkins.Job>
		}
	}

	/**
	 * An object representing an entire Jenkins server as returned by the root API endpoint.
	 */
	export interface Server extends api.Server {
		jobs: Job[]
	}

	export type Fetch<T extends api.Resource> = $api.fp.world.Question<api.Resource,void,T>

	export interface Client {
		request: (p: {
			method: api.Request["method"]
			url: string
		}) => {
			json: <R>() => R
		}

		fetch: {
			server: Fetch<Server>
			job: Fetch<Job>
		}

		Job: {
			config: (job: Job) => slime.runtime.document.Document
		}
	}

	export interface Exports {
		Server: (o: {
			url: string
		}) => {
			request: any
			Session: new (p: {
				credentials: any
			}) => {
				request: any
				api: any
			}
		}

		url: (p: {
			server: api.Server
			path: string
		}) => string

		getVersion: (server: api.Server) => string

		request: {
			json: <R>(p: api.Request) => R
		}

		client: (p: {
			credentials: api.Credentials
		}) => Client
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

			var credentials: api.Credentials = {
				user: jsh.shell.environment["JENKINS_USER"],
				token: jsh.shell.environment["JENKINS_TOKEN"]
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
				var client = subject.client({
					credentials: credentials
				});

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
