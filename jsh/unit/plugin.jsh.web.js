//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2018 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//@ts-check

/**
 * @typedef { slime.jrunscript.http.servlet.handler & { stop?: () => void } } slime.jsh.unit.mock.handler
 */

/**
  * @typedef {Object} slime.jsh.unit.mock.Web.hg
  * @property {Object} config - an object that describes the Mercurial configuration needed for Mercurial to use this mock internet.
  */

/**
 * @typedef { Object } slime.jsh.unit.mock.Web.https
 * @property { number } port
 * @property { slime.jrunscript.http.client.Client } client}
 */

/**
 * @typedef {Object} slime.jsh.unit.mock.Web
 * @property { (handler: slime.jsh.unit.mock.handler) => void } add - adds a handler that can supply parts of the mock internet
 * @property { slime.jrunscript.http.client.Client } client - described on definition page
 * @property { Function } jrunscript - described on definition page
 * @property { Object } environment - the environment to use when launching a process that proxies through this mock internet;
 * 		sets http_proxy variable
 * @property { slime.jsh.unit.mock.Web.hg } hg
 * @property { () => void } start
 * @property { slime.jsh.unit.mock.Web.https } https
 */

/**
 * @typedef {Object} slime.jsh.unit.mock.Web.argument
 * @property {boolean} trace
 */

/**
 * @typedef { new (o?: slime.jsh.unit.mock.Web.argument) => slime.jsh.unit.mock.Web } slime.jsh.unit.Web.constructor.function
 */

/**
 * @typedef {
 		slime.jsh.unit.Web.constructor.function
 * 		& {
 * 			bitbucket: (o: {}) => slime.jsh.unit.mock.handler,
 * 			github: (o: {}) => slime.jsh.unit.mock.handler
 * 		}
 * } slime.jsh.unit.mock.Web.constructor
*/

/**
 * @typedef {{
 * 		Web: slime.jsh.unit.mock.Web.constructor
 * }} slime.jsh.unit.mock
 */

/**
 * @param {Function} $set
 * @param {any} jsh
 * @param {any} Packages
 */
function defineJshUnitMock($set,jsh,Packages) {
	$set({
		isReady: function() {
			return jsh.js && jsh.httpd && jsh.http && jsh.file && jsh.io && jsh.shell && jsh.unit;
		},
		load: function() {
			/** @type { slime.jsh.unit.mock } */
			jsh.unit.mock = {};

			/**
			 * @type { new (o: slime.jsh.unit.mock.Web.argument) => slime.jsh.unit.mock.Web }
			 * @param { slime.jsh.unit.mock.Web.argument } o
			 */
			var Web = function(o) {
				if (!o) o = {
					trace: false
				};

				//	TODO	https doesn't really work, as CONNECT to the real destination is attempted when requests for that
				//			host arrive
				var tomcat = new jsh.httpd.Tomcat({
					https: {}
				});

				/** @type { slime.jsh.unit.mock.handler[] } */
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
										try {
											var rv = handlers[i](request);
											if (typeof(rv) != "undefined") return rv;
										} catch (e) {
											//	if a handler throws an exception, just ignore it
										}
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

				this.client = new jsh.http.Client({
					proxy: {
						http: {
							host: "127.0.0.1",
							port: tomcat.port
						}
					}
				});
				this.client.toString = function() {
					return "Mock client for 127.0.0.1:" + tomcat.port;
				};

				this.jrunscript = function(o) {
					var properties = {
						"http.proxyHost": "127.0.0.1",
						"http.proxyPort": String(tomcat.port)
					};
					jsh.js.Object.set(properties, (o.properties) ? o.properties : {});
					jsh.shell.jrunscript(jsh.js.Object.set({}, o, {
						properties: properties,
						//	TODO	is this necessary, or can it be pushed to jrunscript method?
						arguments: (o.arguments) ? o.arguments : []
					}));
				}

				this.https = {
					port: tomcat.https.port,
					client: new jsh.http.Client({
						proxy: {
							https: {
								host: "127.0.0.1",
								port: tomcat.https.port
							}
						}
					})
				};

				this.environment = {
					"http_proxy": "http://127.0.0.1:" + tomcat.port
				};

				this.hg = {
					config: {
						"http_proxy.host": "127.0.0.1:" + tomcat.port
					}
				};

				this.start = function() {
					tomcat.start();
				}

				this.run = function() {
					tomcat.run();
				}

				this.stop = function() {
					handlers.forEach(function(handler) {
						if (handler.stop) handler.stop();
					});
					tomcat.stop();
				};
			};
			if (jsh.httpd.Tomcat) jsh.unit.mock.Web = Web;
			if (jsh.httpd.Tomcat) jsh.unit.mock.Internet = $api.deprecate(jsh.unit.mock.Web);

			/**
			 * @param { { loopback: boolean, src: any } } o
			 * @returns { slime.jsh.unit.mock.handler }
			 */
			var MockBitbucketApi = function(o) {
				var hgserve;

				var startHgServer = function() {
					if (!hgserve) {
						// Packages.java.lang.System.err.println("Starting mock hg server ...");
						hgserve = new jsh.unit.mock.Hg.bitbucket(o);
						// Packages.java.lang.System.err.println("Created mock hg server.");
						hgserve.start();
						// Packages.java.lang.System.err.println("Started mock hg server.");
					}
					return hgserve;
				};

				var httpd = (function() {
					if (jsh.shell.jsh.src) return jsh.loader.file(jsh.shell.jsh.src.getRelativePath("rhino/http/servlet/server/loader.js"));
				})();

				var getHgServerProxy = (httpd)
					? $api.Function.memoized(function() {
						// Packages.java.lang.System.err.println("Invoke startHgServer");
						var server = startHgServer();
						// Packages.java.lang.System.err.println("Return httpd.Handler.Proxy");
						return new httpd.Handler.Proxy({
							target: {
								host: "127.0.0.1",
								port: server.port
							}
						});
					})
					: void(0)
				;

				var hgserver = (getHgServerProxy) ? getHgServerProxy() : void(0);

				var rv = function(request) {
					//Packages.java.lang.System.err.println("Mock Bitbucket request: " + request.method + " " + request.path);
					if (request.headers.value("host") == "bitbucket.org" || o.loopback) {
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
						} else if (tokenized[2] == "downloads") {
							if (o.src[tokenized[0]] && o.src[tokenized[0]][tokenized[1]]) {
								var downloads = o.src[tokenized[0]][tokenized[1]].downloads;
								var file = tokenized[3];
								if (downloads && downloads[file]) {
									return {
										status: { code: 200 },
										body: {
											stream: downloads[file].read(jsh.io.Streams.binary)
										}
									}
								}
							}
						} else if (o.src[tokenized[0]] && o.src[tokenized[0]][tokenized[1]] && tokenized[2] == "get") {
							//	TODO	is this included in hgweb server?
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
						} else if (getHgServerProxy && o.src[tokenized[0]] && o.src[tokenized[0]][tokenized[1]]) {
							// Packages.java.lang.System.err.println("Forwarding hg server request: " + request.method + " " + request.path);
							//	forward to delegate server
							var delegate = hgserver;
							// Packages.java.lang.System.err.println("Got hg server proxy");
							return delegate(request);
						} else {
							jsh.shell.console("Unhandled: " + tokenized.join("/"));
							return {
								status: { code: 598 }
							}
						}
					}
				};
				rv.stop = function() {
					if (hgserve) hgserve.stop();
				};
				return rv;
			};
			if (jsh.unit.mock.Web) jsh.unit.mock.Web.bitbucket = MockBitbucketApi;
			if (jsh.unit.mock.Internet) jsh.unit.mock.Internet.bitbucket = $api.deprecate(jsh.unit.mock.Web.bitbucket);

			/**
			 *	@returns { slime.jsh.unit.mock.handler }
			 */
			var MockGithubApi = function(o) {
				return function(request) {
					var host = request.headers.value("host");
					if (host == "raw.githubusercontent.com") {
						var pattern = /^(.*?)\/(.*?)\/(.*?)\/(.*)$/;
						var match = pattern.exec(request.path);
						var user = match[1];
						var repo = match[2];
						var ref = match[3];
						var repository = o.src[user][repo];
						var branch = repository.branch().filter(function(b) {
							return b.current;
						})[0];
						if (branch.name == ref) {
							return {
								status: { code: 200 },
								body: {
									type: "text/plain",
									string: repository.directory.getFile(match[4]).read(String)
								}
							}
						} else {
							throw new Error("Unsupported: branch and ref different.");
						}
					}
					return {
						status: { code: 404 }
					}
				}
				return void(0);
			};
			if (jsh.unit.mock.Web) jsh.unit.mock.Web.github = MockGithubApi;

			jsh.unit.mock.Hg = function() {
			};
			jsh.unit.mock.Hg.bitbucket = function(o) {
				// Packages.java.lang.System.err.println("new jsh.unit.mock.Hg.bitbucket");
				var config = [];
				config.push("[paths]");
				for (var x in o.src) {
					for (var y in o.src[x]) {
						//	TODO	repository
						config.push("/" + x + "/" + y + "=" + o.src[x][y].directory);
					}
				}
				var CONFIG = jsh.shell.TMPDIR.createTemporary();
				CONFIG.pathname.write(config.join("\n"), { append: false });

				var port;

				var run = function(p,on) {
					port = jsh.ip.tcp.getEphemeralPortNumber();
					// Packages.java.lang.System.err.println("Starting hg serve on " + port + " ...");
					var started = false;
					var output = {
						line: function(line) {
							// Packages.java.lang.System.err.println("hg serve output: " + line);
							if (/listening at/.test(line)) {
								started = true;
								on.started();
							}
						}
					};
					var error = {
						line: function(line) {
							// Packages.java.lang.System.err.println("hg serve error: " + line);
						}
					};
					var buffer = new jsh.io.Buffer();
					// output = buffer.writeBinary();
					// jsh.shell.console("Starting output reader ...");
					jsh.java.Thread.start(function() {
						// jsh.shell.console("Started output reader thread.");
						try {
							// buffer.readText().read(function(code) {
							// 	jsh.shell.console("hg serve character: " + String.fromCharCode(code));
							// });
						} catch (e) {
							jsh.shell.console("hg serve output error: " + e + " keys = " + Object.keys(buffer));
						}
					});
					// jsh.shell.console("Started output reader.");
					// output = void(0);
					// error = void(0);
					// jsh.shell.console("Running hg serve ...");
					if (!started) {
						jsh.java.Thread.start(function() {
							// Packages.java.lang.System.err.println("Sleeping ...");
							Packages.java.lang.Thread.sleep(500);
							// Packages.java.lang.System.err.println("Done sleeping ...");
							started = true;
							// Packages.java.lang.System.err.println("Executing 500 started callback ...");
							on.started();
							// Packages.java.lang.System.err.println("Assuming started.");
						});
					}
					jsh.shell.run({
						command: "hg",
						arguments: (function() {
							var rv = ["serve"];
							rv.push("-p", String(port));
							//	Adding verbose output causes the server to print a message when it starts
							rv.push("-v");
							rv.push("--web-conf", CONFIG);
							// jsh.shell.console("hg args = " + rv.join(" "));
							return rv;
						})(),
						stdio: {
							output: output,
							error: error
						},
						on: {
							start: function() {
								// Packages.java.lang.System.err.println("on.start: " + on.start);
								if (on && on.start) on.start.apply(this,arguments);
								// Packages.java.lang.System.err.println("on.start invoked");
							}
						}
					});
					Packages.java.lang.System.err.println("Exited hg serve");
				};

				var running;

				Object.defineProperty(this,"port",{
					get: function() {
						// Packages.java.lang.System.err.println("Returning port " + port);
						return port;
					}
				});

				this.start = function(p) {
					var lock = new jsh.java.Thread.Monitor();
					var process;
					if (!running) {
						jsh.java.Thread.start(function() {
							try {
								run(p,{
									start: function() {
										// Packages.java.lang.System.err.println("pid = " + arguments[0].pid);
										process = arguments[0];
									},
									started: function() {
										// Packages.java.lang.System.err.println("Got 'started' callback for hg serve");
										new lock.Waiter({
											until: function() {
												return true;
											},
											then: function() {
												running = process;
											}
										})();
									}
								})
							} catch (e) {
								// Packages.java.lang.System.err.println("e = " + e);
							}
						});
					}
					return new lock.Waiter({
						until: function() {
							return Boolean(running);
						},
						then: function() {
							return running;
						}
					})();
				}

				this.stop = function() {
					if (running) running.kill();
				}
			};
			jsh.unit.mock.git = {};
			jsh.unit.mock.git.Server = function(o) {
				return function(request) {
					var cgi = {
						GIT_HTTP_EXPORT_ALL: "true",
						GATEWAY_INTERFACE: "CGI/1.1"
					};

					if (request.body) {
						cgi.CONTENT_LENGTH = request.headers.value("Content-Length");
						cgi.CONTENT_TYPE = request.headers.value("Content-Type");
					}

					cgi.PATH_INFO = "/" + request.path;
					cgi.PATH_TRANSLATED = o.getLocation(request.path).toString();
					cgi.QUERY_STRING = (request.query) ? request.query.string : "";
					cgi.REMOTE_ADDR = request.source.ip;
					cgi.REQUEST_METHOD = request.method;

					//	TODO	SCRIPT_NAME
					var host = (function(value) {
						if (value.indexOf(":") == -1) {
							return {
								host: value,
								port: "80"
							}
						} else {
							var tokens = value.split(":");
							return {
								host: tokens[0],
								port: tokens[1]
							}
						}
					})(request.headers.value("host"));
					cgi.SERVER_NAME = host.host;
					cgi.SERVER_PORT = host.port;

					cgi.SERVER_PROTOCOL = "HTTP";
					cgi.SERVER_SOFTWARE = "jsh-mock-git-server";

					var stdio = {};

					if (request.body) {
						stdio.input = request.body.stream;
					}

					var stdout = new jsh.io.Buffer();
					stdio.output = stdout.writeBinary();

					jsh.shell.run({
						command: "git",
						arguments: [
							"http-backend"
						],
						stdio: stdio,
						environment: cgi
					});
					stdout.close();

					var stream = stdout.readBinary();

					var Response = function() {
						this.status = { code: 200 };
						this.headers = [];
						this.body = {
						}
					};

					var response = new Response();

					var addLine = function(name,value) {
						if (name.toLowerCase() == "status") {
							var tokens = value.split(" ");
							response.status.code = Number(tokens[0]);
							response.status.message = tokens.slice(1).join(" ");
						} else if (name.toLowerCase() == "content-type") {
							response.body.type = value;
						} else if (name.toLowerCase() == "location") {
							throw new Error("Redirect");
						} else {
							response.headers.push({ name: name, value: value });
						}
					};

					var cgiParser = /^(.*)\:(?:\s*)(.*)$/
					var addRawLine = function(line) {
						var match = cgiParser.exec(line);
						var name = match[1].toLowerCase();
						var value = match[2];
						addLine(name,value);
					}
					if (false) {
						//	TODO	Somehow this does not work; the character version of the stream seems to read ahead or something
						//			which corrupts the version of the stream handed over when headers are finished.
						stream.character().readLines(function(line) {
							if (line.length == 0) return true;
							addRawLine(line);
							//	TODO	Location header not supported; does Git use it?
						}, {
							ending: "\r\n",
							onEnd: function() {
							}
						});
					} else {
						var _in = stream.java.adapt();
						var more = true;
						var line = "";
						while(more) {
							var b = _in.read();
							var c = String.fromCharCode(b);
							// jsh.shell.console("byte: " + b + " char: " + c);
							line += c;
							if (line.substring(line.length-2) == "\r\n") {
								if (line.length == 2) {
									more = false;
								} else {
									var content = line.substring(0,line.length-2);
									addRawLine(content);
									line = "";
								}
							}
						}
					}

					response.body.stream = stream;

					return response;
				};
			};
		}
	});
}

//@ts-ignore
defineJshUnitMock($set, jsh, Packages);
