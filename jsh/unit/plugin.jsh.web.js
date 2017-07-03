$set({
	isReady: function() {
		return jsh.httpd && jsh.http && jsh.file && jsh.io && jsh.shell;
	},
	load: function() {
		if (!jsh.unit) jsh.unit = {};
		jsh.unit.mock = {};
		jsh.unit.mock.Web = function(o) {
			if (!o) o = {};
			var tomcat = new jsh.httpd.Tomcat({
				https: {}
			});

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

			this.client = new jsh.http.Client({
				proxy: {
					http: {
						host: "127.0.0.1",
						port: tomcat.port
					}
				}
			});

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
		jsh.unit.mock.Internet = $api.deprecate(jsh.unit.mock.Web);
		jsh.unit.mock.Web.bitbucket = function(o) {
			var hgserve;

			var startHgServer = function() {
				if (!hgserve) {
					hgserve = new jsh.unit.mock.Hg.bitbucket(o);
					hgserve.start();
				}
				return hgserve;
			};

			var httpd = (function() {
				if (jsh.shell.jsh.src) return jsh.loader.file(jsh.shell.jsh.src.getRelativePath("rhino/http/servlet/server/loader.js"));
			})();

			var getHgServerProxy = (httpd)
				? $api.Function.singleton(function() {
					var server = startHgServer();
					return new httpd.Handler.Proxy({
						target: {
							host: "127.0.0.1",
							port: server.port
						}
					});
				})
				: void(0)
			;

			var rv = function(request) {
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
						//	forward to delegate server
						var delegate = getHgServerProxy();
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
		jsh.unit.mock.Internet.bitbucket = $api.deprecate(jsh.unit.mock.Web.bitbucket);

		jsh.unit.mock.Hg = function() {
		};
		jsh.unit.mock.Hg.bitbucket = function(o) {
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
				jsh.shell.run({
					command: "hg",
					arguments: (function() {
						var rv = ["serve"];
						port = jsh.ip.tcp.getEphemeralPortNumber();
						rv.push("-p", String(port));
						rv.push("--web-conf", CONFIG);
						return rv;
					})(),
					on: {
						start: function() {
							if (on && on.start) on.start.apply(this,arguments);
							try {
								Packages.java.lang.Thread.sleep(500);
							} catch (e) {
							}
						}
					}
				})
			};

			var running;

			Object.defineProperty(this,"port",{
				get: function() {
					return port;
				}
			});

			this.start = function(p) {
				var lock = new jsh.java.Thread.Monitor();
				if (!running) {
					jsh.java.Thread.start(function() {
						run(p,{
							start: function() {
								jsh.shell.console("started");
								var process = arguments[0];
								new lock.Waiter({
									until: function() {
										return true;
									},
									then: function() {
										jsh.shell.console("setting");
										running = process;
									}
								})();
							}
						})
					});
				}
				return new lock.Waiter({
					until: function() {
						jsh.shell.console("Checking");
						return Boolean(running);
					},
					then: function() {
						jsh.shell.console("Returning ...");
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
//						jsh.shell.console("byte: " + b + " char: " + c);
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
