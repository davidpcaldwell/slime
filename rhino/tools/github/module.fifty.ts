//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.unit.mock.web.github {
	interface User {
		[x: string]: slime.jrunscript.tools.git.repository.Local
	}

	export interface src {
		[x: string]: User
	}
}

/**
 * ## API
 *
 * The SLIME GitHub API is in a state of flux.
 *
 * GitHub types are generated using a `dtsgenerator`-based impleementation that can be run via
 * `rhino/tools/github/tools/types.jsh.js`. This emits `rhino/tools/github/tools/github-rest.d.ts`, which **should** be committed
 * to source control (as it contains the latest GitHub API, generated at the time of running the program). The generator output
 * is based on the GitHub [OpenAPI description](https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json).
 *
 * ## Contributing
 *
 * There are various levels of mocking available for GitHub.
 *
 * * An arbitrarily-configured GitHub may be mocked via {@link slime.jsh.unit.mock.web.Github}.
 * * A GitHub configured only with SLIME (potentially for testing remote shells) is provided by {@link slime.jsh.test.remote.Exports}.
 */
namespace slime.jrunscript.tools.github {
	export interface Context {
		library: {
			web: slime.web.Exports
			io: slime.jrunscript.io.Exports
			http: slime.jrunscript.http.client.Exports
			shell: slime.jsh.Global["shell"]
		}
	}

	export interface Repository {
		id: number
		node_id: string
		name: string
		full_name: string
	}

	export interface Session {
		repositories: { list: () => Repository[] }
	}

	export namespace rest {
		export interface Request {
			method: string
			path: string
			query: object
			body: object
		}

		export interface Operation<I,O> {
			request: (p: I) => Request
			response: (p: slime.jrunscript.http.client.spi.Response) => O
		}

		export interface Invocation<I,E,O> {
			argument: (i: I) => {
				run: (r: {
					world: {
						request: slime.jrunscript.http.client.spi.Implementation
					}
				}) => slime.$api.fp.world.old.Ask<E,O>
			}
		}

		//	https://docs.github.com/en/rest/overview/resources-in-the-rest-api#pagination
		export interface Pagination {
			next?: string
			last?: string
			first?: string
			prev?: string
		}

		export interface Page<T> {
			page: T[]
			link: Pagination
		}

		export interface Paged<I,O> extends Operation<I,O[]> {
		}
	}

	export interface Exports {
		Session: (o: {
			credentials: {
				user: string
				password: string
			}
		}) => slime.jrunscript.tools.github.Session

		isProjectUrl: (p: {
			owner: string
			name: string
		}) => (url: slime.web.Url) => boolean

		parseLinkHeader: (value: string) => { [x: string]: string }

		request: {
			get: <Q extends object>(path: string) => (q: Q) => rest.Request
			delete: <Q extends object>(path: string) => (q: Q) => rest.Request
			post: <B extends object>(path: string) => (b: B) => rest.Request

			test: {
				parsePathParameters: (specification: { method: string, path: string }, parameters: { [x: string]: string }) => {
					method: string
					path: string
					query: { [x: string]: string }
				}
			}
		}

		response: {
			empty: (p: slime.jrunscript.http.client.spi.Response) => {}
			json: {
				resource: (status: number) => <T>(p: slime.jrunscript.http.client.spi.Response) => T
				page: <T>(p: slime.jrunscript.http.client.spi.Response) => T
			}
		}

		operation: {
			reposGet: rest.Operation<{ owner: string, repo: string },slime.external.github.rest.paths.ReposGet.Responses.$200>
			reposCreateForAuthenticatedUser: rest.Operation<slime.external.github.rest.paths.ReposCreateForAuthenticatedUser.RequestBody,slime.external.github.rest.paths.ReposCreateForAuthenticatedUser.Responses.$201>
			reposDelete: rest.Operation<{ owner: string, repo: string },slime.external.github.rest.paths.ReposDelete.Responses.$204>
		}

		api: (p: {
			server: slime.web.Url
		}) => {
			authentication: (p: {
				username: string
				token: string
			}) => {
				operation: <I,E,O>(operation: rest.Operation<I,O>) => rest.Invocation<I,E,O>

				paginated: <I,E,O>(operation: rest.Paged<I,O>) => rest.Invocation<I,E,O[]>
			}
		}
	}

	export type Script = slime.loader.Script<Context,Exports>;

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const jsh = fifty.global.jsh;
			const { verify, run } = fifty;

			var script: Script = fifty.$loader.script("module.js");
			var subject = script({
				library: {
					web: jsh.web,
					io: jsh.io,
					http: jsh.http,
					shell: jsh.shell
				}
			});

			var server = subject.api({
				server: jsh.web.Url.parse("https://api.github.com/")
			}).authentication({
				username: "davidpcaldwell",
				token: jsh.shell.environment.TOKEN
			});

			fifty.tests.world = function() {
				run(fifty.tests.world.ReposListForAuthenticatedUser);
				run(fifty.tests.world.ReposGet);
			}

			fifty.tests.world.ReposListForAuthenticatedUser = function() {
				var listUserRepos: rest.Paged<
					slime.external.github.rest.paths.ReposListForAuthenticatedUser.QueryParameters,
					slime.js.ArrayElement<slime.external.github.rest.paths.ReposListForAuthenticatedUser.Responses.$200>
				> = {
					request: subject.request.get("user/repos"),
					response: subject.response.json.page
				};

				var ask = server.paginated(
					listUserRepos
				).argument({
				}).run({
					world: void(0)
				});

				var result = ask();

				jsh.shell.console("length = " + result.length);
				jsh.shell.console(JSON.stringify(
					result.map(function(repo) {
						return {
							name: repo["name"]
						}
					}),void(0),4)
				);

				verify(result).evaluate(function(p) { return p.length > 1 }).is(true);
				verify(result).evaluate(function(p) { return p.find(function(item) { return item["name"] == "slime"; }) != null } ).is(true);
			};

			fifty.tests.parsePathParameters = function() {
				var specification = {
					method: "GET",
					path: "/path/{foo}/{bar}"
				};
				var parameters = {
					foo: "FOO",
					bar: "BAR",
					baz: "BAZ"
				};
				var parsed = subject.request.test.parsePathParameters(specification,parameters);
				verify(parsed).method.is("GET");
				verify(parsed).path.is("/path/FOO/BAR");
				verify(parsed).query.evaluate( function(p) { return Object.keys(p); }).length.is(1);
				verify(parsed).query.baz.is("BAZ");
			}

			fifty.tests.world.ReposGet = function() {
				var reposGet: rest.Operation<{ owner: string, repo: string },slime.external.github.rest.components.Schemas.FullRepository> = subject.operation.reposGet;

				var ask = server.operation(reposGet).argument({
					owner: "davidpcaldwell",
					repo: "slime"
				}).run({
					world: void(0)
				});

				var result = ask();

				verify(result).is.type("object");

				var notFound = server.operation(reposGet).argument({
					owner: "davidpcaldwell",
					repo: "foo"
				}).run({
					world: void(0)
				})();

				verify(notFound).is(null);
			}
		}
	//@ts-ignore
	)(fifty);

}

(
	function(
		fifty: slime.fifty.test.Kit
	) {

		fifty.tests.suite = function() {
			const verify = fifty.verify;
			const api = fifty.global.jsh.tools.github;
			verify(api).evaluate.property("Session").is.type("function");
			verify(api).evaluate.property("Foo").is.type("undefined");

			fifty.run(fifty.tests.parsePathParameters);
		}
	}
//@ts-ignore
)(fifty);
