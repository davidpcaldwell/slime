//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.unit.Exports["browser"] } $exports
	 */
	function(Packages,$api,jsh,$exports) {
		$exports.Modules = function(slime,pathnames) {
			var common = (function() {
				var isCommonAncestor = function(directory,list) {
					for (var i=0; i<list.length; i++) {
						var prefix = directory.toString();
						if (list[i].toString().substring(0,prefix.length) != prefix) {
							return false;
						}
					}
					return true;
				}

				var paths = [slime.getRelativePath("jsh/unit")].concat(pathnames);
				var directory = slime.getSubdirectory("jsh/unit");
				while(!isCommonAncestor(directory,paths)) {
					directory = directory.parent;
				}
				return directory;
			})();

			//	TODO	could not slimepath be ../../ something if the page is under jsh? And does that matter?
			var slimepath = slime.toString().substring(common.toString().length).split("/").slice(0,-1).join("/");
			if (slimepath) {
				slimepath += "/";
			}

			var modules = pathnames.map(function(pathname) {
				var string = (pathname.directory) ? pathname.directory.toString() : pathname.toString();
				return { path: string.substring(common.toString().length).replace(/\\/g, "/") };
			});

			var browserTest = function(p) {
				var successUrl = (p.interactive) ? null : slimepath + "loader/browser/test/success";

				var startServer = function(p) {
					var tomcat = new jsh.httpd.Tomcat({
						port: p.port
					});
					var parameters = {
						url: successUrl
					};
					for (var x in p.parameters) {
						parameters[x] = p.parameters[x];
					}
					jsh.shell.echo("Starting server ...");
					tomcat.map({
						path: "",
						servlets: {
							//	alternative would be to allow an actual servlet, rather than file, to be specified using servlet plugin
							//	and then somehow control threading from here: servlet could be defined above and could receive browser
							//	callback and release lock allowing loop to proceed
							//	TODO	should we enhance the servlet plugin interface to allow something other than a file?
							"/*": {
								file: slime.getFile("jsh/unit/browser.servlet.js"),
								parameters: parameters
							}
						},
						resources: p.resources
					});
					tomcat.start();
					jsh.shell.echo("Tomcat base directory: " + tomcat.base);
					return new function() {
						this.port = tomcat.port;

						this.url = function(url) {
							return "http://127.0.0.1:" + tomcat.port + "/" + url;
						};

						this.run = function() {
							tomcat.run();
						};

						this.stop = function() {
							tomcat.stop();
						}
					};
				};

				var browseTestPage = function(p) {
					var opened = p.browser.browse(p.tomcat.url(p.url),p.done);
					if (!p.interactive) {
						var output = p.client.request({
							url: p.tomcat.url(successUrl.split("/").slice(0,-1).join("/") + "/console")
						});
						var consoleJson = JSON.parse(output.body.stream.character().asString());
						var response = p.client.request({
							url: p.tomcat.url(successUrl)
						});
						var success = (function(string) {
							if (string == "false") return false;
							if (string == "true") return true;
							if (string == "null") return null;
							return string;
						})(response.body.stream.character().asString());
						if (opened && opened.close) {
							opened.close();
						}

						return {
							console: consoleJson,
							success: success
						};
					}
				};

				var tomcat = startServer(p);
				jsh.shell.echo("Browsing test page ... " + tomcat.url(p.url));
				var done = (p.interactive) ? function() {
					jsh.shell.console("Stopping Tomcat ...");
					tomcat.stop();
				} : null;
				var result = browseTestPage(jsh.js.Object.set({}, { tomcat: tomcat, client: new jsh.http.Client(), done: done }, p));
				if (p.interactive) {
					tomcat.run();
				} else {
					var name = (p.browser.name) ? p.browser.name : "Browser";
					return jsh.unit["Suite"].Events({
						name: name,
						events: result.console
					});
				}
			};

			this.test = function(p) {
				var getBrowserTestRequest = function(modules) {
					jsh.shell.echo("Testing modules ...");
					modules.forEach(function(item) {
						jsh.shell.echo("Testing module: " + item.path);
					});
					var url = slimepath + "loader/browser/test/client.html";
					var parameters = [];
					modules.forEach(function(item) {
						parameters.push({ name: "module", value: "../../../" + slimepath.split("/").map(function(item) { return ""; }).join("../") + item.path });
					});
					return {
						url: url,
						parameters: parameters,
						build: function() {
							//	TODO	do we not have a library somewhere that does this?
							var urlencode = function(s) {
								return String(Packages.java.net.URLEncoder.encode(s));
							};

							return this.url + "?" + this.parameters.map(function(item) {
								return urlencode(item.name) + "=" + urlencode(item.value);
							}).join("&");
						}
					};
				};

				var request = getBrowserTestRequest(modules.filter(p.browser.filter));
				if (!p.interactive) {
					request.parameters.push({ name: "callback", value: "server" });
				}
				jsh.shell.echo("fullurl = " + request.build());
				return browserTest(jsh.js.Object.set({}, {
					port: p.port,
					browser: p.browser,
					resources: (function() {
						var rv = new jsh.httpd.Resources.Old();
						rv.map("", common.pathname);
						return rv;
					})(),
					url: request.build(),
					interactive: p.interactive
				}, (p.coffeescript) ? { parameters: { coffeescript: p.coffeescript } } : {}));
			}
		};

		var Browser = function(p) {
			var lock = new jsh.java.Thread.Monitor();
			var opened;

			var on = {
				start: function(p) {
					new lock.Waiter({
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
			};

			this.name = p.name;

			this.filter = (p.exclude) ?
				function(module) {
					if (p.exclude(module)) {
						return false;
					}
					return true;
				}
				: function(module) {
					return true;
				}
			;

			this.browse = function(uri) {
				jsh.shell.echo("Starting browser thread...");
				jsh.java.Thread.start({
					call: function() {
						p.open(on)(uri);
					}
				});
				var returner = new lock.Waiter({
					until: function() {
						return Boolean(opened);
					},
					then: function() {
						return opened;
					}
				});
				return returner();
			};

			this.delegate = p;
		};

		$exports.Browser = Browser;

		$exports.IE = function(p) {
			return new Browser({
				name: (p.name) ? p.name : "Internet Explorer",
				open: function(on) {
					return function(uri) {
						jsh.shell.run({
							command: p.program,
							arguments: [
								uri
							],
							on: on
						});
					};
				}
			})
		};

		if (jsh.shell.os.name == "Mac OS X") {
			$exports.Safari = function(p) {
				return new Browser({
					name: (p.name) ? p.name : "Safari",
					open: function(on) {
						return function(uri) {
							jsh.shell.run({
								command: "open",
								arguments: [
									"-a", p.program.parent.parent.parent.toString(),
									uri
								],
								on: on
							});
						};
					}
				});
			}
		}

		$exports.Firefox = function(p) {
			return new Browser(new function() {
				var PROFILE = jsh.shell.TMPDIR.createTemporary({ directory: true });

				this.name = (p.name) ? p.name : "Firefox";

				this.open = function(on) {
					return function(uri) {
						jsh.shell.run({
							command: p.program,
							arguments: [
								"-no-remote",
								"-profile", PROFILE.toString(),
								uri
							],
							on: on
						});
					};
				};
			});
		};

		$exports.Chrome = function(p) {
			if (!p) p = {};
			this.name = (p.name) ? p.name : "Google Chrome";

			this.filter = function(module) {
				return true;
			}

			var user = (p.user) ? p.user : jsh.shell.TMPDIR.createTemporary({ directory: true });

			if (!user.getFile("First Run")) {
				user.getRelativePath("First Run").write("", { append: false });
			}

			this.browse = function(uri,done) {
				//	ignoring p.program
				var url = jsh.web.Url.parse(uri);
				var browser = new jsh.shell.browser.chrome.Instance({
					directory: user,
					proxy: jsh.shell.browser.ProxyConfiguration({ port: url.port })
				});
				url.host = "unit";
				url.port = void(0);
				var lock = new jsh.java.Thread.Monitor();
				var opened;
				browser.launch({
					uri: url.toString(),
					on: {
						start: function(p) {
							new lock.Waiter({
								until: function() {
									return true;
								},
								then: function() {
									opened = new function() {
										this.close = function() {
											p.kill();
										}
									}
								}
							})();
						},
						close: function() {
							if (done) done.call(opened);
						}
					}
				});
				var returner = new lock.Waiter({
					until: function() {
						return Boolean(opened);
					},
					then: function() {
						return opened;
					}
				});
				return returner();
			};
		};

		/** @type { { [id: string]: slime.jsh.unit.old.Browser } } */
		var browsers = {};

		$exports.installed = Object.assign([], browsers);

		var addBrowser = function(id,value) {
			$exports.installed.push(value);
			value.id = id;
			$exports.installed[id] = value;
		}

		if (jsh.shell.browser.chrome) {
			addBrowser("chrome", new $exports.Chrome());
		}

		var add = function(name,program) {
			var constructor = $exports[name];
			if (jsh.file.Pathname(program).file && constructor) {
				addBrowser(name.toLowerCase(), new constructor({ program: jsh.file.Pathname(program).file }));
			}
		};

		//	Windows
		add("IE","C:\\Program Files\\Internet Explorer\\iexplore.exe");

		//	Mac OS X
		add("Safari","/Applications/Safari.app/Contents/MacOS/Safari");
		add("Firefox","/Applications/Firefox.app/Contents/MacOS/firefox");

		//	Linux
		add("Firefox", "/usr/bin/firefox");

		var local = (
			/**
			 *
			 * @returns { slime.jsh.unit.Exports["browser"]["local"] }
			 */
			function local() {
				/**
				 *
				 * @param { slime.jsh.unit.internal.browser.Configuration } configuration
				 * @returns { slime.jsh.unit.Browser }
				 */
				var Browser = function(configuration) {
					var process;
					return {
						open: function(p) {
							jsh.java.Thread.start(function() {
								jsh.shell.world.run(
									jsh.shell.Invocation.create({
										command: configuration.program,
										arguments: configuration.arguments.concat([p.uri])
									})
								)({
									start: function(e) {
										process = e.detail;
									}
								})
							});
						},
						close: function() {
							process.kill();
						}
					}
				}

				var Firefox = function(configuration) {
					var PROFILE = jsh.shell.TMPDIR.createTemporary({ directory: true });
					return Browser({
						program: configuration.program,
						arguments: $api.Array.build(function(rv) {
							rv.push("-no-remote");
							rv.push("-profile", PROFILE.toString())
						})
					});
				}

				/** @type { slime.jsh.unit.Exports["browser"]["local"]["Chrome"] } */
				var Chrome = function(configuration) {
					var chrome = new jsh.shell.browser.chrome.Instance({
						location: jsh.file.object.pathname(
							jsh.file.world.filesystems.os.pathname(configuration.user)
						),
						devtools: configuration.devtools
					});

					/** @type { { kill: any } } */
					var process;
					return {
						//name: "Google Chrome",
						open: function(p) {
							jsh.java.Thread.start(function() {
								chrome.run({
									//	TODO	enhance chrome.run so it can take a Url object rather than just a string
									uri: p.uri,
									arguments: (configuration.debugPort) ? ["--remote-debugging-port=" + configuration.debugPort ] : [],
									on: {
										start: function(p) {
											process = p;
										}
									}
								});
							});
						},
						close: function() {
							process.kill();
						}
					}
				}

				return {
					Chrome: Chrome,
					Firefox: Firefox
				}
			}
		)();

		$exports.local = local;

		var selenium = (
			/**
			 *
			 * @returns { slime.jsh.unit.Exports["browser"]["selenium"] }
			 */
			function() {
				/**
				 * The `jsh` shell uses the Java system properties as a convenient global storage location, and puts its own
				 * streams into properties to communicate between, if memory servers, the launcher and loader. This could perhaps
				 * be refactored so that they were stored in a class loaded by a shared classloader, or a ThreadLocal, or something,
				 * but for now they're there. And the Selenium remote driver loops through system properties, assuming they're
				 * strings, and does something with them. So we need to remove these streams before creating the RemoteWebDriver
				 * and replace them afterward (this second part is probably not necessary, as the system property stream references
				 * are probably only used at startup,  but seems like good hygiene)
				 * @returns
				 */
				var SystemPropertyStreams = function() {
					//	TODO	remove need for the property manipulation by patching Selenium or transferring these global
					//			properties to be in the inonit.script.jsh.Main Java class itself; would they be available where
					//			needed?
					//	TODO	extend Properties to properly include superclass methods?
					/** @type { any } */
					var _properties = Packages.java.lang.System.getProperties();
					var saved = {};
					var streams = ["stdin", "stdout", "stderr"];

					return {
						remove: function() {
							streams.forEach(function(name) {
								saved[name] = _properties.get("inonit.script.jsh.Main." + name);
								_properties.remove("inonit.script.jsh.Main." + name);
							});
						},
						replace: function() {
							streams.forEach(function(name) {
								_properties.put("inonit.script.jsh.Main." + name, saved[name]);
							})
						}
					}
				}

				/**
				 *
				 * @param { slime.fifty.browser.test.internal.script.SeleniumChrome } [configuration]
				 * @returns { slime.jsh.unit.Browser }
				 */
				var FiftySeleniumChrome = function(configuration) {
					jsh.shell.tools.selenium.load();
					var _driver;
					return {
						open: function(p) {
							var _options = new Packages.org.openqa.selenium.chrome.ChromeOptions();
							_driver = new Packages.org.openqa.selenium.chrome.ChromeDriver(_options);
							_driver.get(p.uri);
						},
						close: function() {
							_driver.quit();
						}
					}
				};

				/**
				 *
				 * @param { { host: string, port: number }} configuration
				 * @param { slime.jrunscript.native.org.openqa.selenium.Capabilities } _capabilities
				 */
				var RemoteSelenium = function(configuration, _capabilities) {
					jsh.shell.tools.selenium.load();
					var _driver;
					return {
						open: function(p) {
							var streams = SystemPropertyStreams();
							streams.remove();
							_driver = new Packages.org.openqa.selenium.remote.RemoteWebDriver(
								new Packages.java.net.URL("http://" + configuration.host + ":" + configuration.port + "/wd/hub"),
								_capabilities
							);
							streams.replace();
							_driver.get(p.uri);
						},
						close: function() {
							_driver.quit();
						}
					}
				}

				/** @type { slime.jsh.unit.Exports["browser"]["selenium"]["remote"]["Chrome"] } */
				var RemoteSeleniumChrome = function(configuration) {
					return RemoteSelenium(
						configuration,
						new Packages.org.openqa.selenium.chrome.ChromeOptions()
					);
				}

				return {
					Chrome: FiftySeleniumChrome,
					remote: {
						Chrome: RemoteSeleniumChrome
					}
				}
			}
		)();

		$exports.selenium = selenium;
	}
//@ts-ignore
)(Packages,$api,jsh,$exports);
