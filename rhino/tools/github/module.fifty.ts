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
 * The GitHub API is in a state of flux.
 *
 * GitHub types are generated using a `dtsgenerator`-based impleementation that can be run via
 * `rhino/tools/github/tools/types.jsh.js`. This emits `rhino/tools/github/tools/github-rest.d.ts`, which **should** be committed
 * to source control (as it contains the latest GitHub API, generated at the time of running the program).
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

		api: (p: {
			server: slime.web.Url
		}) => {
			authentication: (p: {
				username: string
				token: string
			}) => {
				operation: <I,E,O>(operation: rest.Operation<I,O>) => {
					argument: (i: I) => {
						run: (r: {
							world: slime.jrunscript.http.client.World
						}) => slime.$api.fp.impure.Ask<E,O>
					}
				}
			}
		}
	}

	export type Script = slime.loader.Script<Context,Exports>;

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const jsh = fifty.global.jsh;

			fifty.tests.world = function() {
				var script: Script = fifty.$loader.script("module.js");
				var subject = script({
					library: {
						http: jsh.http,
						shell: jsh.shell,
						web: jsh.web
					}
				});
				var listUserRepos: rest.Operation<slime.external.github.rest.paths.ReposListForAuthenticatedUser.QueryParameters,slime.external.github.rest.paths.ReposListForAuthenticatedUser.Responses.$200> = {
					request: function(p) {
						return {
							method: "GET",
							path: "user/repos",
							query: p
						};
					},
					response: function(p) {
						var string = p.stream.character().asString();
						return JSON.parse(string);
					}
				};

				var ask = subject.api({
					server: jsh.web.Url.parse("https://api.github.com/")
				}).authentication({
					username: "davidpcaldwell",
					token: jsh.shell.environment.TOKEN
				}).operation(
					listUserRepos
				).argument({
				}).run({
					world: void(0)
				});

				var result = ask();

				jsh.shell.console(JSON.stringify(result));
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
