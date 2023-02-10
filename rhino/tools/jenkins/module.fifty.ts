//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.jenkins {
	export interface Context {
		library: {
			io: slime.jrunscript.io.Exports
			http: slime.jrunscript.http.client.Exports
			document: slime.runtime.document.Exports
		}
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			const { jsh } = fifty.global;
			var script: Script = fifty.$loader.script("module.js");
			return script({
				library: {
					io: jsh.io,
					document: jsh.document,
					http: jsh.http
				}
			})
		//@ts-ignore
		})(fifty);
	}

	export namespace api {
		export interface Resource {
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

	/**
	 * Descriptor for a remote server.
	 */
	export interface Server extends api.Resource {
		/**
		 * The base URL of the server, including the trailing `/`.
		 */
		url: string

		jobs?: Job[]
	}

	export interface Job extends api.Resource {
		_class?: string
		name?: string
		color?: string
	}

	export namespace job {
		export interface Id {
			server: Server
			name: string
		}
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

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Server: {
			url: (server: Server) => (path: string) => string
		}

		Job: {
			from: {
				id: (p: job.Id) => Job
			}
			isName: (name: string) => slime.$api.fp.Predicate<Job>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { subject } = test;

			fifty.tests.exports.Job = function() {
				var server: Server = {
					url: "http://example.com/"
				};

				var job = subject.Job.from.id({
					server: server,
					name: "foo"
				});

				verify(job).url.is("http://example.com/job/foo/");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		getVersion: (server: Server) => string

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
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			const { subject } = test;

			fifty.tests.world = fifty.test.Parent();

			fifty.tests.world.root = fifty.test.Parent();

			var server: Server = {
				url: jsh.shell.environment["JENKINS_SERVER"]
			};

			var credentials: api.Credentials = {
				user: jsh.shell.environment["JENKINS_USER"],
				token: jsh.shell.environment["JENKINS_TOKEN"]
			};

			fifty.tests.world.root.raw = function() {
				var response = subject.request.json({
					method: "GET",
					url: subject.Server.url(server)("api/json"),
					credentials: credentials
				});
				jsh.shell.console(JSON.stringify(response, void(0), 4));
			};

			fifty.tests.world.root.bound = function() {
				var client = subject.client({
					credentials: credentials
				});

				var response = client.request({
					method: "GET",
					url: server.url
				}).json();

				jsh.shell.console(JSON.stringify(response, void(0), 4));
			};

			fifty.tests.world.getVersion = function() {
				var version = subject.getVersion(server)

				jsh.shell.console("[" + version + "]");
			};
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
