//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.unit.mock.github {
	interface User {
		[x: string]: slime.jrunscript.git.repository.Local
	}

	export interface src {
		[x: string]: User
	}
}

/**
 * The SLIME GitHub API is in a state of flux.
 *
 * GitHub types are generated using a `dtsgenerator`-based impleementation that can be run via
 * `rhino/tools/github/tools/types.jsh.js`. This emits `rhino/tools/github/tools/github-rest.d.ts`, which **should** be committed
 * to source control (as it contains the latest GitHub API, generated at the time of running the program). The generator output
 * is based on the GitHub [OpenAPI description](https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json).
 */
namespace slime.jrunscript.tools.github {
	export interface Context {
		library: {
			web: slime.web.Exports
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
		}

		export interface Operation<I,O> {
			request: (p: I) => Request
			response: (p: slime.jrunscript.http.client.spi.Response) => O
		}

		export interface Invocation<I,E,O> {
			argument: (i: I) => {
				run: (r: {
					world: slime.jrunscript.http.client.World
				}) => slime.$api.fp.impure.Ask<E,O>
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
		}

		response: {
			json: <T>(p: slime.jrunscript.http.client.spi.Response) => T
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
			fifty: slime.fifty.test.kit
		) {
			const jsh = fifty.global.jsh;
			const { run } = fifty;

			var script: Script = fifty.$loader.script("module.js");
			var subject = script({
				library: {
					http: jsh.http,
					shell: jsh.shell,
					web: jsh.web
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
			}

			fifty.tests.world.ReposListForAuthenticatedUser = function() {
				var listUserRepos: rest.Paged<
					slime.external.github.rest.paths.ReposListForAuthenticatedUser.QueryParameters,
					ArrayElement<slime.external.github.rest.paths.ReposListForAuthenticatedUser.Responses.$200>
				> = {
					request: subject.request.get("user/repos"),
					response: subject.response.json
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
							name: repo.name
						}
					}),void(0),4)
				);
			};

			fifty.tests.world.ReposGet = function() {
				var reposGet: rest.Operation<{ owner: string, repo: string },slime.external.github.rest.components.Schemas.FullRepository> = {
					request: function(p) {
						return {
							method: "GET",
							path: "/repos/" + p.owner + "/" + p.repo,
							query: null
						}
					},
					response: function(p) {
						if (p.status.code == 404) return null;
						return JSON.parse(p.stream.character().asString());
					}
				};

				var ask = server.operation(reposGet).argument({
					owner: "davidpcaldwell",
					repo: "slime"
				}).run({
					world: void(0)
				});

				var result = ask();

				function formatRepo(p: slime.external.github.rest.components.Schemas.FullRepository): { name: any, owner: any, size: any } {
					if (!p) return p;
					return {
						name: p.name,
						owner: p.owner,
						size: p.size
					};
				}

				jsh.shell.console(JSON.stringify(
					fifty.global.$api.Function.result(
						result,
						formatRepo
					),
					void(0),
					4
				));

				var notFound = server.operation(reposGet).argument({
					owner: "davidpcaldwell",
					repo: "foo"
				}).run({
					world: void(0)
				})();

				jsh.shell.console(
					JSON.stringify(
						fifty.global.$api.Function.result(
							notFound,
							formatRepo
						)
					)
				)
			}
		}
	//@ts-ignore
	)(fifty);

}

(
	function(
		fifty: slime.fifty.test.kit
	) {

		fifty.tests.suite = function() {
			const verify = fifty.verify;
			const api = fifty.global.jsh.tools.github;
			verify(api).evaluate.property("Session").is.type("function");
			verify(api).evaluate.property("Foo").is.type("undefined");
		}
	}
//@ts-ignore
)(fifty);
