//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

plugin({
	isReady: function() {
		return Boolean(jsh.unit);
	},
	load: function() {
		jsh.unit.$slime = $slime;
		// jsh.unit.$slime = {};
		// ["$platform","$api","mime","coffee","java","io","Loader","Resource","plugins"].forEach(function(property) {
		// 	jsh.unit.$slime[property] = $slime[property];
		// });
	}
});

plugin({
	isReady: function() {
		return Boolean(jsh.java && jsh.io && jsh.shell && jsh.unit && jsh.unit.Scenario && jsh.unit.html);
	},
	load: function() {
		var remote = $loader.file("remote.js", {
			api: {
				java: jsh.java,
				unit: jsh.unit
			}
		});

		jsh.unit.Scenario.Events = function(p) {
			return new remote.Events(p);
		}
		jsh.unit.Scenario.Stream = function(p) {
			return new remote.Stream(p);
		};


		var view = $loader.file("view.js", {
			api: {
				java: jsh.java,
				unit: jsh.unit
			}
		});

		jsh.unit.view = {};
		jsh.unit.view.Console = function(p) {
			return new jsh.unit.View(new view.Console(p));
		};
		jsh.unit.view.Events = function(p) {
			return new view.Events(p);
		};
		jsh.unit.view.options = function() {
			var views = {};
			views.console = function() {
				return new jsh.unit.view.Console( { writer: jsh.shell.stdio.error } );
			};
			views.stdio = function() {
				return new jsh.unit.view.Events({ writer: jsh.shell.stdio.output });
			}
			return views;
		};
		jsh.unit.view.options.select = function(name) {
			return jsh.unit.view.options()[name]();
		}
		jsh.unit.interface = {};
		jsh.unit.interface.create = function(suite,o) {
			if (!o.view) throw new Error("Required: 'view' property representing view to which test results should be sent.");
			//	TODO	argument checking for valid values of view
			if (o.view == "structure") {
				jsh.shell.echo(JSON.stringify(jsh.unit.getStructure(suite)));
				jsh.shell.exit(0);
			}
			var view = jsh.unit.view.options.select(o.view);
			view.listen(suite);
			var success = suite.run({ path: o.path });
			if (o.view == "stdio") {
				jsh.shell.exit(0);
			} else {
				jsh.shell.exit( (success) ? 0 : 1 );
			}
		};

		var html = $loader.file("html.js", {
			jsh: jsh,
			html: jsh.unit.html,
			$slime: jsh.unit.$slime
		});

		jsh.unit.html.Part = function(p) {
			if (!p.pathname) throw new TypeError("jsh.unit.html.Part: 'pathname' property must be present")
			return new html.PartDescriptor(p);
		};

		jsh.unit.html.Suite = (function(was) {
			return function() {
				was.apply(this,arguments);

				//	TODO	undocumented
				this.cli = function(p) {
					var suite = this;
					jsh.unit.interface.create(suite.build(), new function() {
						// TODO: is this redundant? Value of "chrome" should just work, right? Or is it because we want to specify instance?
						this.view = p.view;

						if (p.part) {
							var tokens = p.part.split(":");
							var path = suite.getPath({
								part: tokens[0],
								element: tokens[1]
							});
							//	TODO	below seems like hack, probably can be more specific: part was found, but HTML path was not?
							//	TODO	could also improve error reporting
							if (path[1] === null) {
								throw new Error("Not found: path " + p.part);
							}
							this.path = path;
						}
					})
				};
			}
		})(jsh.unit.html.Suite);

		jsh.unit.html.cli = function(p) {
			p.suite.cli(p);
		}

		jsh.unit.html.documentation = html.documentation;

		//	TODO	probably will move to loader/api
		jsh.unit.part = {};
		jsh.unit.part.Html = $api.deprecate(jsh.unit.html.Part);
		$api.deprecate(jsh.unit, "part");
		jsh.unit.Scenario.Html = $api.deprecate(function(p) {
			return new html.Scenario(p);
		});

		jsh.unit.Suite.Fork = function(p) {
			return new function() {
				this.name = p.name;

				this.execute = function(scope,verify) {
					var buffer = new jsh.io.Buffer();
					var arg = jsh.js.Object.set({}, p, {
						stdio: {
							output: buffer.writeBinary()
						}
					});
					var ranWithoutException = true;
					jsh.java.Thread.start(function() {
						try {
							p.run(arg);
						} catch (e) {
							Packages.java.lang.System.err.println(e);
							Packages.java.lang.System.err.println(e.stack);
							ranWithoutException = false;
							//	Note that this is in a thread so will not be caught here, but may be caught by uncaught exception
							//	handler
							throw e;
						} finally {
							buffer.close();
						}
					});
					var decoder = new remote.Decoder({
						stream: buffer.readBinary(),
						received: function(e) {
							verify.fire(e.type,e.detail);
						}
					});
					decoder.run();
					verify(ranWithoutException, "Forked process ran without exception").is(true);
				}
			};
		};

		jsh.unit.Suite.Events = function(p) {
			return {
				create: function() {
					this.name = p.name;

					this.execute = function(scope,verify) {
						p.events.forEach(function(event) {
							verify.scope.fire(event.type,event.detail);
						});
					}
				}
			};
		}

		jsh.unit.Suite.Command = function(p) {
			return new function() {
				this.name = (function() {
					if (p.name) return p.name;
					if (p.command) return [p.command].concat( (p.arguments) ? p.arguments : [] );
					return "Suite.Command (unnamed)"
				})();

				this.execute = function(scope,verify) {
					var o = {};
					for (var x in p) {
						if (x != "name" && x != "run") {
							o[x] = p[x];
						}
					}
					if (o.evaluate) {
						o.evaluate = (function(was) {
							return function(result) {
								return was.call(null,result,verify);
							}
						})(o.evaluate);
					} else {
						o.evaluate = function(result) {
							verify(result).status.is(0);
						};
					}
					p.run(o);
				}
			};
		}

		jsh.unit.fifty = {
			Part: function(p) {
				return new jsh.unit.Suite.Fork({
					run: jsh.shell.jsh,
					shell: p.shell,
					//	always tools/fifty/test.jsh.js, but used as argument because could be a built shell
					script: p.script,
					arguments: [p.file,"--view", "jsapi"]
				})
			}
		}
	}
});

plugin({
	isReady: function() {
		return jsh.js && jsh.web && jsh.shell && jsh.httpd && jsh.httpd.Tomcat && jsh.http && jsh.unit && jsh.unit.Scenario && jsh.unit.Scenario.Events && jsh.java && jsh.file;
	},
	load: function() {
		//	TODO	probably can switch this to the $loader.script mechanism, it looks like a normal script
		var $exports = {};
		$loader.run("plugin.jsh.browser.js", { $exports: $exports, jsh: jsh });
		jsh.unit.browser = $exports;

		var serializeEvent = function(e) {
			var serializeError = function recurse(e) {
				return {
					name: e.name,
					message: e.message,
					stack: e.stack,
					code: e.code,
					cause: (e.cause) ? recurse(e.cause) : null
				};
			};

			var json = {
				type: e.type,
				timestamp: e.timestamp,
				detail: e.detail
			};

			var paths = e.path.map(function(source) {
				return source.id;
			});
			json.path = paths;

			if (json.detail.error) {
				json.detail.error = serializeError(json.detail.error);
			}
			return json;
		};

		var Chrome = function(p) {
			var location = (p && p.profile) ? p.profile : jsh.shell.TMPDIR.createTemporary({
				directory: true
			}).pathname;
			var directory = location.createDirectory({
				exists: function(dir) {
					return false;
				}
			});
			var fr = directory.getRelativePath("First Run");
			if (!fr.file) {
				fr.write("", { append: false });
			}
			var browser = new jsh.shell.browser.chrome.Instance({ directory: directory });
			var server = new jsh.httpd.Tomcat({
				port: p.port
			});

			var lock = new jsh.java.Thread.Monitor();
			var messages = [];

			var post = new lock.Waiter({
				until: function() {
					return true;
				},
				then: function(e) {
					messages.push(e);
				}
			});

			var get = new lock.Waiter({
				until: function() {
					return true;
				},
				then: function() {
					var rv = messages.map(serializeEvent);
					messages.splice(0,messages.length);
					return rv;
				}
			});

			var src = (jsh.shell.jsh.src) ? jsh.shell.jsh.src : jsh.shell.jsh.home.getSubdirectory("src");
			var loader = new jsh.file.Loader({ directory: src });

			server.map({
				path: "",
				servlets: {
					"/*": {
						load: function(scope) {
							scope.$loader = $loader;
							var server = loader.module("loader/api/ui/server.js", {
								suite: p.suite,
								messages: get
							});
							scope.$exports.handle = server.handle;
						},
						parameters: {}
					}
				},
				resources: {
					loader: $loader,
					Loader: jsh.file.Loader
				}
			});
			server.start();
			browser.launch({
				app: "http://127.0.0.1:" + server.port + "/" + p.page
			});
			return new jsh.unit.View(function(e) {
				post(e);
			});
		};

		jsh.unit.interface.Chrome = function(p) {
			//	expects suite, port, profile, page properties
			var rv = new Chrome(jsh.js.Object.set({}, p, {
				page: "loader/api/ui/ui.html"
			}));
			rv.listen(p.suite);
			return rv;
		}
		jsh.unit.interface.create = (function(was) {
			return function(suite,o) {
				if (o.chrome || o.view == "chrome") {
					var p = jsh.js.Object.set({}, { suite: suite }, o.chrome);
					return new jsh.unit.interface.Chrome(p);
				}
				return was.apply(this,arguments);
			}
		})(jsh.unit.interface.create);
	}
});

plugin($loader.value("plugin.jsh.web.js", { jsh: jsh }));
