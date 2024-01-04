//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.Loader } $loader
	 * @param { (value: any) => void } $set
	 */
	function(Packages,$api,jsh,$loader,$set) {
		$set({
			isReady: function() {
				return jsh.js && jsh.httpd && jsh.http && jsh.file && jsh.io && jsh.shell && jsh.unit;
			},
			load: function() {
				var code = {
					/** @type { slime.jsh.unit.bitbucket.Script } */
					bitbucket: $loader.script("bitbucket.js")
				};

				/** @type { slime.jsh.unit.mock } */
				jsh.unit.mock = {
					Web: void(0),
					Hg: void(0),
					git: void(0),
					bitbucket: void(0)
				};

				var Web = Object.assign(function(o) {
					if (!o) o = {
						trace: false
					};

					var httpsHosts = [];

					/** @type { slime.jsh.unit.mock.handler[] } */
					var handlers = [];

					this.addHttpsHost = function(hostname) {
						httpsHosts.push(hostname);
					}

					this.add = function(handler) {
						handlers.push(handler);
					}

					var tomcat;

					this.port = void(0);
					this.client = void(0);
					this.https = void(0);
					this.environment = void(0);
					this.hg = void(0);

					this.start = function() {
						var https = (function() {
							if (!httpsHosts.length) return void(0);
							var keystore = jsh.shell.TMPDIR.createTemporary({ suffix: ".p12" }).pathname;

							var mkcert = jsh.shell.tools.mkcert.require();

							mkcert.pkcs12({ to: keystore, hosts: httpsHosts });

							/** @type { slime.jsh.httpd.tomcat.Configuration["https"] } */
							return {
								port: void(0),
								keystore: {
									file: keystore.file,
									password: "changeit"
								}
							};
						})();

						//	TODO	https doesn't really work, as CONNECT to the real destination is attempted when requests for that
						//			host arrive
						tomcat = jsh.httpd.Tomcat({
							https: https
						});

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

						this.https = (https) ? {
							port: tomcat.https.port,
							client: new jsh.http.Client({
								proxy: {
									https: {
										host: "127.0.0.1",
										port: tomcat.https.port
									}
								}
							})
						} : void(0);

						//	TODO	perhaps need HTTPS here
						this.environment = {
							"http_proxy": "http://127.0.0.1:" + tomcat.port
						};

						//	TODO	perhaps need HTTPS here
						this.hg = {
							config: {
								"http_proxy.host": "127.0.0.1:" + tomcat.port
							}
						};

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
				}, { bitbucket: void(0), github: void(0) });
				if (jsh.httpd.Tomcat) jsh.unit.mock.Web = Web;

				var bitbucket = code.bitbucket({
					library: {
						file: jsh.file
					}
				});

				jsh.unit.mock.bitbucket = bitbucket;

				if (jsh.unit.mock.Web) jsh.unit.mock.Web.bitbucket = $api.deprecate(bitbucket);

				jsh.unit.mock.Hg = {
					/** @constructor */
					host: function(o) {
						// Packages.java.lang.System.err.println("new jsh.unit.mock.Hg.host");
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
									rv.push("--web-conf", CONFIG.toString());
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

						this.port = void(0);

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
												lock.Waiter({
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
							return lock.Waiter({
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
)(Packages,$api,jsh,$loader,$set)
