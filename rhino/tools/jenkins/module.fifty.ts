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

	export interface Server {
		/**
		 * The base URL of the server, including the trailing `/`.
		 */
		url: string
	}

	export interface Exports {
		Server: new (o: {}) => {}

		request: {
			json: <R>(p: {
				server: Server
				credentials: {
					user: string
					token: string
				}
				method: "GET"
				path: string
			}) => R
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

			fifty.tests.manual = {};

			fifty.tests.manual.root = function() {
				var response = subject.request.json({
					server: {
						url: jsh.shell.environment["JENKINS_SERVER"]
					},
					method: "GET",
					path: "api/json",
					credentials: {
						user: jsh.shell.environment["JENKINS_USER"],
						token: jsh.shell.environment["JENKINS_TOKEN"]
					}
				});
				jsh.shell.console(JSON.stringify(response, void(0), 4));
			}
		}
	//@ts-ignore
	)(fifty);


	export type Script = slime.loader.Script<Context,Exports>
}
