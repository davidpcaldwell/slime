//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.js && jsh.io && jsh.shell && jsh.unit;
	},
	load: function() {
		var ForkScenario = function(p) {
			return new jsh.unit.Scenario({
				name: p.name,
				execute: function(scope) {
					p.method(jsh.js.Object.set({}, p, {
						evaluate: function(result) {
							scope.test(function() {
								return {
									success: !result.status,
									message: "Exit status " + result.status
								}
							});
						}
					}))
				}
			});
		}

		jsh.unit.CommandScenario = function(p) {
			return new ForkScenario(jsh.js.Object.set({}, p, {
				method: jsh.shell.run
			}));
		};
		jsh.unit.ScriptScenario = function(p) {
			return new ForkScenario(jsh.js.Object.set({}, p, {
				method: jsh.shell.jsh
			}));
		};
//		jsh.unit.Scenario.Integration = function(p) {
//			return new jsh.unit.Scenario.Fork(jsh.js.Object.set({}, p, {
//				run: jsh.shell.jsh,
//				arguments: ["-scenario", "-view", "child"]
//			}));
////			var buffer = new jsh.io.Buffer();
////			var write = buffer.writeBinary();
////			return jsh.shell.jsh({
////				fork: true,
////				shell: p.shell,
////				script: p.script,
////				arguments: ["-scenario", "-view", "child"],
////				stdio: {
////					output: write
////				},
////				evaluate: function(result) {
////					write.java.adapt().flush();
////					buffer.close();
////					return new jsh.unit.Scenario.Stream({
////						name: p.script.toString(),
////						stream: buffer.readBinary()
////					});
////				}
////			})
//		}

		jsh.unit.Suite.Integration = function(p) {
			return new jsh.unit.Suite.Fork(jsh.js.Object.set({}, p, {
				run: jsh.shell.jsh,
				arguments: ["-scenario", "-view", "stdio"]
			}));
		}

		//	if -scenario is on command line, invokes scenario, otherwise run()
		//	scenario: receives a composite scenario as this, receives command-line arguments as function arguments, view argument
		//		[console/webview/child] determines format of scenario reporting
		//	run: receives processed results of getopts as argument
		jsh.unit.integration = function(o) {
			var parameters = jsh.script.getopts({
				options: {
					scenario: false,
					part: String,
					view: "console"
				},
				unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
			});
			var getopts = (o.getopts) ? jsh.script.getopts(o.getopts, parameters.arguments) : { options: {}, arguments: parameters.arguments };
			if (parameters.options.scenario) {
				var scenario = new jsh.unit.Suite({
					name: jsh.script.file.pathname.basename
				});
				o.scenario.call(scenario,getopts);
				var path = (parameters.options.part) ? parameters.options.part.split("/") : void(0);
				jsh.unit.interface.create(scenario, { view: parameters.options.view, path: path });
			} else {
				o.run(getopts);
			}
		}
	}
});

plugin({
	isReady: function() {
		return jsh.shell && jsh.script;
	},
	load: function() {
		if (!jsh.test) jsh.test = {};
		jsh.test.requireBuiltShell = function(p) {
			if (!jsh.shell.jsh.home) {
				jsh.shell.echo("Building shell in which to relaunch ...");
				var parameters = jsh.script.getopts({
					options: {
						executable: false,
						install: jsh.script.getopts.ARRAY(String),
						downloads: jsh.file.Pathname,
						rhino: jsh.file.Pathname
					},
					unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
				});
				var JSH_HOME = jsh.shell.TMPDIR.createTemporary({ directory: true });
				//	TODO	locate jrunscript using Java home
				//	TODO	add these APIs for properties, etc., to jsh.shell.jrunscript
				var args = [];
				if (parameters.options.downloads) {
					args.push("-Djsh.build.downloads=" + parameters.options.downloads);
				}
//				if (parameters.options.rhino) {
//					args.push("-Djsh.build.rhino.jar=" + parameters.options.rhino);
//				} else if (Packages.java.lang.System.getProperty("jsh.engine.rhino.classpath")) {
//					args.push("-Djsh.engine.rhino.classpath=" + Packages.java.lang.System.getProperty("jsh.engine.rhino.classpath"));
//				}
				var SLIME = (function(p) {
					if (p && p.src) return p.src;
					if (jsh.shell.jsh.home) return jsh.shell.jsh.home.getSubdirectory("src");
					return jsh.shell.jsh.src;
				})(p);
				args.push(SLIME.getRelativePath("rhino/jrunscript/api.js"));
				args.push("jsh");
				args.push(SLIME.getRelativePath("jsh/etc/build.jsh.js"));
				args.push(JSH_HOME);
				args.push("-notest");
				args.push("-nodoc");
				if (parameters.options.rhino) {
					args.push("-rhino", parameters.options.rhino);
				}
				if (parameters.options.executable) {
					args.push("-executable");
				}
				parameters.options.install.forEach(function(addon) {
					args.push("-install", addon);
				});
				jsh.shell.run({
					command: jsh.shell.java.jrunscript,
					arguments: args
				});
				var environment = {};
				for (var x in jsh.shell.environment) {
					environment[x] = jsh.shell.environment[x];
				}
				if (jsh.shell.jsh.lib.getSubdirectory("tomcat")) {
					jsh.shell.echo("Adding Tomcat to shell ...")
					environment.CATALINA_HOME = String(jsh.shell.jsh.lib.getSubdirectory("tomcat"));
				}
				jsh.shell.echo("Relaunching with arguments " + parameters.arguments);
				jsh.shell.jsh({
					fork: true,
					shell: JSH_HOME,
					environment: environment,
					script: jsh.script.file,
					arguments: parameters.arguments,
					evaluate: function(result) {
						jsh.shell.exit(result.status);
					}
				});

			}
		}
	}
});

plugin({
	isReady: function() {
		return jsh.httpd && jsh.http && jsh.file && jsh.io && jsh.shell;
	},
	load: function() {
		if (!jsh.test) jsh.test = {};
		jsh.test.mock = {};
		jsh.test.mock.Internet = function(o) {
			if (!o) o = {};
			var tomcat = new jsh.httpd.Tomcat({});

			var handlers = [];

			tomcat.map({
				//	TODO	works with or without leading slash; document this and write a test
				path: "",
				servlets: {
					"/*": {
						//	TODO	document load method
						load: function(scope) {
							//	TODO	this is duplicative with httpd.Handler.series in a way; similar concept. We would not have access to httpd
							//			variable is one difference, and the other one is immutable. So leaving both for now. This might also end
							//			up some sort of variation in $api (although the other variety might as well)
							scope.$exports.handle = function(request) {
								if (o.trace) {
									Packages.java.lang.System.err.println("Request: " + request.method + " " + request.headers.value("host") + " " + request.path);
								}
								for (var i=0; i<handlers.length; i++) {
									var rv = handlers[i](request);
									if (typeof(rv) != "undefined") return rv;
								}
								//	TODO	convert to appropriate 4xx or 5xx response (have not decided)
								throw new Error("Unhandled: request: host=" + request.headers.value("host") + " path = " + request.path);
							}
						}
					}
				}
			});

			this.add = function(handler) {
				handlers.push(handler);
			}

			this.port = tomcat.port;
			
			this.start = function() {
				tomcat.start();
			}
			
			this.run = function() {
				tomcat.run();
			}

			this.client = new jsh.http.Client({
				proxy: {
					http: {
						host: "127.0.0.1",
						port: tomcat.port
					}
				}
			});

			this.stop = function() {
				tomcat.stop();
			};
		};
		jsh.test.mock.Internet.bitbucket = function(o) {
			return function(request) {
				if (request.headers.value("host") == "bitbucket.org") {
					if (request.path == "") {
						return {
							status: {
								code: 200
							},
							body: {
								type: "text/javascript",
								string: "print('Hello, World! from mock Bitbucket')"
							}
						}
					}
					var Sourceroot = function(root) {
						var loader = new jsh.file.Loader({ directory: root.directory });
						var HEAD = null;
						var required;
						if (root.access) {
							required = new jsh.http.Authentication.Basic.Authorization(root.access);
							debugger;
						}
						this.get = function(body,tokens) {
							var type = tokens.shift();
							if (type == "raw") {
								var version = tokens.shift();
								if (version == "local") {
									var authorization = request.headers.value("Authorization");
									if (required && required != authorization) {
										return {
											status: {
												code: 401
											}
										};
									}
									var path = tokens.join("/");
									var pathname = root.directory.getRelativePath(path);
									if (pathname.file) {
										//Packages.java.lang.System.err.println("File: " + pathname);
										return {
											status: {
												code: 200
											},
											body: (body) ? loader.get(path) : HEAD
										}
									} else if (pathname.directory) {
										//Packages.java.lang.System.err.println("Directory: " + pathname);
										return {
											status: {
												code: 200
											},
											body: (body) ? {
												type: "text/plain",
												string: (function() {
													return pathname.directory.list({ type: pathname.directory.list.ENTRY }).map(function(entry) {
														//Packages.java.lang.System.err.println("Path: " + entry.path);
														return entry.path.replace(String(Packages.java.io.File.separator),"/");
													}).filter(function(path) {
														return path != ".hg/";
													}).join("\n");
												})()
											} : HEAD
										}
									} else {
										return {
											status: {
												code: 404
											}
										}
										//Packages.java.lang.System.err.println("Not found: " + pathname);
									}
								}
							}
						}
					}
					var tokenized = request.path.split("/");
					if (tokenized.slice(0,3).join("/") == "api/1.0/repositories" || tokenized[2] == "raw") {
						var user;
						var repository;
						if (tokenized.slice(0,3).join("/") == "api/1.0/repositories") {
							tokenized.shift();
							tokenized.shift();
							tokenized.shift();
						}
						user = tokenized[0];
						repository = tokenized[1];
						tokenized.shift();
						tokenized.shift();
						if (o.src[user] && o.src[user][repository]) {
							var body = (request.method == "GET");
							//jsh.shell.console("tokenized = " + tokenized);
							return new Sourceroot(o.src[user][repository]).get(body, tokenized);
						} else {
							throw new Error("No definition for repository " + user + "/" + repository);
						}
					} else if (o.src[tokenized[0]] && o.src[tokenized[0]][tokenized[1]] && tokenized[2] == "get") {
						var SRC = o.src[tokenized[0]][tokenized[1]];
						if (tokenized[3] == "local.zip") {
							try {
								var buffer = new jsh.io.Buffer();
								var to = buffer.writeBinary();
								var list = SRC.directory.list({
									filter: function(node) {
										if (node.pathname.basename == ".hg") return false;
										return true;
									},
									descendants: function(dir) {
										if (dir.pathname.basename == ".hg") return false;
										return true;
									},
									type: SRC.list.ENTRY
								});
								jsh.file.zip({
									from: list.map(function(entry) {
										if (entry.node.directory) {
											var path = (entry.path) ? entry.path.substring(0,entry.path.length-1).replace(/\\/g, "/") : "";
											return {
												directory: "slimelocal/" + path
											}
										}
										var rv = {
											path: "slimelocal/" + entry.path.replace(/\\/g, "/")
										};
										Object.defineProperty(rv, "stream", {
											get: function() {
												return entry.node.read(jsh.io.Streams.binary);
											}
										});
										return rv;
									}),
									to: to
								});
								buffer.close();
								return {
									status: { code: 200 },
									body: {
										type: "application/zip",
										stream: buffer.readBinary()
									}
								};
							} catch (e) {
								jsh.shell.console("Error: " + e);
								jsh.shell.console("Stack: " + e.stack);
								throw e;
							}
						}
					}
				}
			};
		}
	}
})