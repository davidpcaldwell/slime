//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		var parameters = jsh.script.getopts({
			options: {
				interactive: false,
				"chrome:data": jsh.file.Pathname,
				"debug:devtools": false,
				port: Number,
				success: false
			}
		});

		var SLIME = new jsh.file.Loader({ directory: jsh.script.file.parent.parent.parent.parent.parent });

		var lock = new jsh.java.Thread.Monitor();

		var result = {
			success: void(0),
			received: function(v) {
				jsh.shell.console("Received result from client: " + v);
				var self = this;
				//	TODO	lock.Waiter may not have intelligent 'this' handling
				lock.Waiter({
					until: function() { return true; },
					then: function() {
						self.success = v;
					}
				})();
			}
		};

		var tomcat = jsh.httpd.Tomcat({ port: parameters.options.port });
		tomcat.map({
			path: "/",
			servlets: {
				"/*": {
					load: function(scope) {
						scope.$exports.handle = function(request) {
							if (request.path == "loader/api/ui/test/result") {
								jsh.shell.console("Resolving result from client ...");
								var json = request.body.stream.character().asString();
								jsh.shell.console("Got result JSON=" + json);
								result.received(JSON.parse(json));
								return { status: { code: 200 } };
							}
							if (SLIME.get(request.path)) {
								jsh.shell.console("Request: GET " + request.path);
								return {
									status: { code: 200 },
									body: SLIME.get(request.path)
								}
							} else {
								return {
									status: { code: 404 }
								}
							}
						}
					}
				}
			}
		});
		tomcat.start();

		jsh.shell.console("Started Tomcat.");

		var chrome = new jsh.shell.browser.chrome.Instance({
			location: parameters.options["chrome:data"],
			devtools: parameters.options["debug:devtools"]
		});

		if (parameters.options.interactive) {
			chrome.run({
				uri: "http://" + "127.0.0.1:" + tomcat.port + "/loader/api/ui/test/browser.html" + ((parameters.options.success) ? "?success" : "")
			});
		} else {
			/** @type { { close: () => void } } */
			var opened;

			chrome.launch({
				uri: "http://" + "127.0.0.1:" + tomcat.port + "/loader/api/ui/test/browser.html?unit.run" + ((parameters.options.success) ? "&success" : ""),
				on: {
					start: function(p) {
						lock.Waiter({
							until: function() {
								return true;
							},
							then: function() {
								opened = new function() {
									this.close = function() {
										jsh.shell.echo("Killing browser process " + p + " ...");
										p.kill();
										jsh.shell.echo("Killed.");
									}
								}
							}
						})();
					}
				}
			});

			jsh.shell.console("Initiated Chrome launch.");

			jsh.shell.console("Waiting for Chrome launch to return process ...");
			lock.Waiter({
				until: function() { return Boolean(opened); },
				then: function() {
					jsh.shell.console("opened = " + opened);
				}
			})();
			//	Since we wait above until opened is truthy, we can now assert it's truthy for TypeScript
			/** @type { (opened: any) => asserts opened } */
			var untilOpened = function(opened) {}
			untilOpened(opened);

			jsh.shell.console("Chrome subprocess launched.");

			jsh.shell.console("Waiting for result ...");
			lock.Waiter({
				until: function() { return typeof(result.success) != "undefined" },
				then: function() {
				}
			})();

			jsh.shell.console("Result received; result.success = " + result.success);
			opened.close();
			if (result.success === parameters.options.success) {
				jsh.shell.console("Success: " + result.success);
				jsh.shell.exit(0);
			} else {
				jsh.shell.console("Failure: result=" + result.success + ", not " + parameters.options.success);
				jsh.shell.exit(1);
			}
		}
	}
//@ts-ignore
)(jsh);
