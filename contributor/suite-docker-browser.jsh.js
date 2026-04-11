//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		jsh.loader.plugins(jsh.script.file.parent);

		jsh.project.suite.initialize({
			selenium: true
		});

		if (!jsh.unit.browser) {
			jsh.shell.console("No jsh.unit.browser; failing.");
			jsh.shell.exit(1);
		}

		if (jsh.shell.environment.SLIME_TEST_NO_BROWSER) {
			//	TODO	remove references to this
			jsh.shell.console("Obsolete (?) SLIME_TEST_NO_BROWSER set; failing.")
			jsh.shell.exit(1);
		}

		//	TODO	can this ever be set?
		var noselfping = false;

		var environment = new jsh.project.suite.Environment({
			src: jsh.script.file.parent.parent,
			noselfping: noselfping,
			tomcat: true,
			executable: Boolean(jsh.shell.PATH.getCommand("gcc"))
		});

		/** @type { { arguments: string[], options: { view: string, port: any, part: string } } } */
		var parameters = {
			//	TODO	most likely obsolete
			arguments: [],
			//	TODO	most likely obsolete
			options: {
				//	TODO	we use issue317 below
				view: "console",
				port: void(0),
				part: void(0)
			}
		}

		var suite = new jsh.unit.html.Suite();

		suite.add("browsers", new function() {
			var browsers = $api.Array.build(function(rv) {
				rv.push({ id: "dockercompose:selenium:chrome", name: "Chrome (Selenium)" });
				//	TODO	need to debug why this didn't work:
				//	TypeError: Cannot call method "start" of undefined
				rv.push({ id: "dockercompose:selenium:firefox", name: "Firefox (Selenium)" });
			});

			this.name = "Browser tests";

			this.parts = new function() {
				this.jsapi = {
					parts: {}
				};

				this.fifty = {
					parts: {}
				};

				browsers.forEach(function(browser) {
					this.jsapi.parts[browser.id] = jsh.unit.Suite.Fork({
						name: browser.name + " jsapi",
						run: jsh.shell.jsh,
						//	TODO	was environment.jsh.home, but that seemed to be a bug, so replacing with what value actually
						//			seemed to be.
						shell: void(0),
						script: environment.jsh.src.getFile("loader/browser/test/suite.jsh.js"),
						arguments: [
							"-suite", environment.jsh.src.getFile("contributor/browser-jsapi-suite.js"),
							"-browser", browser.id,
							"-view", "stdio"
						].concat(parameters.arguments),
						// TODO: is setting the working directory necessary?
						directory: environment.jsh.src
					});
				},this);

				this.fifty = (
					/** @returns { { parts: { [x: string]: any } } } */
					function() {
						/** @type { { [x: string]: any }} */
						var parts = {};
						browsers.forEach(function(browser) {
							parts[browser.id] = jsh.unit.Suite.Fork({
								name: "Fifty (" + browser.name + ")",
								run: jsh.shell.run,
								command: environment.jsh.src.getFile("fifty"),
								arguments: [
									"test.browser",
									"--browser", browser.id,
									environment.jsh.src.getFile("contributor/browser.fifty.ts")
								],
								directory: environment.jsh.src
							});
						});
						return { parts: parts };
					}
				)();
			}
		});


		suite.add("tools", {
			initialize: function() {
				environment.jsh.built.requireTomcat();
			},
			parts: {
				browser: (!jsh.shell.environment.SLIME_TEST_NO_BROWSER) ? {
					parts: new function() {
						var debugging = (parameters.options["issue317"]) ? ["-debug:devtools"] : []
						this.api = {
							parts: {
								failure: {
									execute: function(scope,verify) {
										if (jsh.shell.browser.chrome) jsh.shell.jsh({
											shell: environment.jsh.built.home,
											script: environment.jsh.src.getFile("loader/api/ui/test/browser.jsh.js"),
											arguments: [].concat(debugging),
											evaluate: function(result) {
												verify(result).status.is(0);
											}
										})
									}
								},
								success: {
									execute: function(scope,verify) {
										if (jsh.shell.browser.chrome) jsh.shell.jsh({
											shell: environment.jsh.built.home,
											script: environment.jsh.src.getFile("loader/api/ui/test/browser.jsh.js"),
											arguments: ["-success"].concat(debugging),
											evaluate: function(result) {
												verify(result).status.is(0);
											}
										})
									}
								}
							}
						}
					}
				} : {
					execute: function(scope,verify) {
						var message = "Skipping tools/browser; browser not present.";
						verify(message).is(message);
					}
				}
			}
		});

		jsh.project.suite.run({
			view: parameters.options.view,
			port: parameters.options.port,
			part: parameters.options.part,
			suite: suite
		});
	}
//@ts-ignore
)($api,jsh);
