namespace slime.jsh.unit {
	export interface mock {
		Web: mock.Web.constructor
		Internet: any
		Hg: any
		git: any
	}

	export namespace mock {
		export type handler = slime.servlet.handler & { stop?: () => void }

		export namespace Web {
			export interface hg {
				/** an object that describes the Mercurial configuration needed for Mercurial to use this mock internet. */
				config: object
			}

			export interface https {
				port: number
				client: slime.jrunscript.http.client.Client
			}

			export interface argument {
				trace: boolean
			}

			namespace constructor {
				export type Function = new (o?: slime.jsh.unit.mock.Web.argument) => slime.jsh.unit.mock.Web
			}

			export type constructor = constructor.Function & {
				bitbucket: (o: {}) => handler
				github: (o: {}) => handler
			}
		}

		export interface Web {
			/** adds a handler that can supply parts of the mock internet */
			add: (handler: jsh.unit.mock.handler) => void

			/** described on definition page */
			client: slime.jrunscript.http.client.Client

			/** described on definition page */
			jrunscript: Function

			/** the environment to use when launching a process that proxies through this mock internet; sets http_proxy variable */
			environment: object

			hg: Web.hg

			start: () => void

			stop: () => void

			https: Web.https
		}

		(
			function(
				fifty: slime.fifty.test.kit
			) {
				var jsh = fifty.global.jsh;

				fifty.tests.suite = function() {
					fifty.verify("mock").is("mock");

					var web = new jsh.unit.mock.Web({ trace: true });
					web.add(function(request) {
						if (request.headers.value("host") == "mockweb.slime.com") {
							return {
								status: {
									code: 200
								},
								body: {
									type: "application/json",
									string: JSON.stringify({ path: request.path })
								}
							}
						}
						return void(0);
					});
					web.start();
					var client = web.client;
					var response = client.request({
						url: "http://mockweb.slime.com/foo-bar-baz"
					});
					var json: { path: string } = JSON.parse(response.body.stream.character().asString());
					fifty.verify(json).path.is("foo-bar-baz");
					web.stop();
				}
			}
		//@ts-ignore
		)(fifty)
	}
}
