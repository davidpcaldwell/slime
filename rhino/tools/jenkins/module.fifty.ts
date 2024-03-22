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
			/**
			 * The root URL of the Jenkins server having this job, including the trailing `/`.
			 */
			server: string

			/**
			 * The name of the job on the Jenkins server.
			 */
			name: string
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
		Job: {
			isName: (name: string) => slime.$api.fp.Predicate<Job>

			Id: {
				url: (id: job.Id) => string
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { subject } = test;

			// fifty.tests.exports.Job = function() {
			// 	var server: Server = {
			// 		url: "http://example.com/"
			// 	};

			// 	var job = subject.Job.from.id({
			// 		server: server,
			// 		name: "foo"
			// 	});

			// 	verify(job).url.is("http://example.com/job/foo/");
			// }
		}
	//@ts-ignore
	)(fifty);

	export type Get<I,T extends api.Resource> = slime.$api.fp.world.Sensor<I,void,slime.$api.fp.Maybe<T>>
	export type Fetch<T extends api.Resource> = slime.$api.fp.world.Sensor<T,void,T>

	export interface Client {
		get: {
			/**
			 * A {@link Get} that returns a {@link Server} given the base URL of that server.
			 */
			server: Get<string, Server>

			/**
			 * A {@link Get} that returns a {@link Job} given its {@link job.Id}, that is, the server it is on
			 */
			job: Get<job.Id, Job>
		}

		fetch: {
			job: Fetch<Job>
		}

		Job: {
			config: slime.$api.fp.world.Sensor<Job,void,slime.runtime.document.Document>
		}
	}

	export interface Exports {
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
			const { $api, jsh } = fifty.global;

			const { subject } = test;

			var server = jsh.shell.environment["JENKINS_SERVER"];

			var client = subject.client({
				credentials: {
					user: jsh.shell.environment["JENKINS_USER"],
					token: jsh.shell.environment["JENKINS_TOKEN"]
				}
			});

			var jobs = {
				exists: jsh.shell.environment["JENKINS_JOB"],
				absent: jsh.shell.environment["JENKINS_NOT_JOB"]
			}

			fifty.tests.world = fifty.test.Parent();

			fifty.tests.world.get = fifty.test.Parent();

			fifty.tests.world.get.server = fifty.test.Parent();

			fifty.tests.world.get.server.resource = function() {
				var response = $api.fp.world.now.ask(client.get.server(server));

				jsh.shell.console(JSON.stringify(response, void(0), 4));
			};

			fifty.tests.world.get.server.no = function() {
				var response = $api.fp.world.now.ask(client.get.server("https://www.google.com/"));

				jsh.shell.console(JSON.stringify(response, void(0), 4));
			};

			fifty.tests.world.get.job = fifty.test.Parent();

			fifty.tests.world.get.job.exists = function() {
				var job = {
					server: server,
					name: jobs.exists
				};

				var response = $api.fp.world.now.ask(client.get.job(job));

				jsh.shell.console(JSON.stringify(response, void(0), 4));
			};

			fifty.tests.world.get.job.absent = function() {
				var job = {
					server: server,
					name: jobs.absent
				};

				var response = $api.fp.world.now.ask(client.get.job(job));

				jsh.shell.console(JSON.stringify(response, void(0), 4));
			}

			fifty.tests.world.fetch = fifty.test.Parent();

			fifty.tests.world.fetch.job = function() {
				var response = $api.fp.world.now.ask(client.get.server(server));

				if (!response.present) throw new Error("Not Jenkins: " + server);
				jsh.shell.console("First job: " + JSON.stringify(response.value.jobs[0]));

				var fetched = $api.fp.world.now.question(client.fetch.job, response.value.jobs[0]);

				jsh.shell.console(JSON.stringify(fetched, void(0), 4));
			};
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
