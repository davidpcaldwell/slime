//@ts-check

/**
 * @typedef {object} slime.jrunscript.tools.github.Context
 * @property { { http: slime.jrunscript.http.client, shell: jsh.shell } } library
 */

/**
 * @typedef {object} slime.jrunscript.tools.github.Exports
 * @property {any} Session
 */

//	Work around tsc bug not allowing first expression to be parenthetical
void(0);
(
	/**
	 * @param {slime.jrunscript.tools.github.Context} $context
	 * @param {slime.jrunscript.tools.github.Exports} $exports
	 * @param {*} Packages
	 */
	function($context,$exports,Packages) {
		$exports.Session = function(o) {
			var apiUrl = function(relative) {
				return "https://api.github.com/" + relative;
			};

			var apiClient = (function(o) {
				var client = new $context.library.http.Client({
					authorization: (o.credentials) ? $context.library.http.Authentication.Basic.Authorization({
						user: o.credentials.user,
						password: o.credentials.password
					}) : void(0)
				});

				var evaluate = function(response) {
					if (response.status.code == 404) return null;
					var string = response.body.stream.character().asString();
					if (response.status.code != 200) {
						$context.library.shell.console("Response code: " + response.status.code + " " + response.request.method + " " + response.request.url);
						$context.library.shell.console(string);
						$context.library.shell.console("");
					}
					var rv = (string) ? JSON.parse(string) : void(0);
					if (response.status.code == 403 && rv && rv.documentation_url == "https://developer.github.com/v3/#abuse-rate-limits") {
						return {
							retry: true
						}
					}
					if (rv && rv.message == "Bad credentials") throw new Error("Bad credentials.");
					return rv;
				};

				client.request = (function(was) {
					return function(p) {
						var more = true;
						var retry = 1;
						var rv;
						while(more) {
							rv = was.call(this, $api.Object.compose(p, {
								evaluate: evaluate
							}));
							if (rv && rv.retry) {
								//	TODO	X.X should use Retry-After
								//			see https://developer.github.com/v3/guides/best-practices-for-integrators/#dealing-with-abuse-rate-limits
								$context.library.shell.console("Sleeping for " + retry + " seconds...");
								Packages.java.lang.Thread.sleep(retry * 1000);
								retry *= 2;
							} else {
								return rv;
							}
						}
					}
				})(client.request);

				return client;
			})(o);

			return new function() {
				this.repositories = new function() {
					this.list = function() {
						return apiClient.request({
							url: apiUrl("user/repos")
						});
					};
				}
			};
		}
	}
//@ts-ignore
)($context,$exports,Packages)
