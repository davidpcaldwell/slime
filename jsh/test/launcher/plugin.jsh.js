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
		return jsh.httpd.Tomcat && jsh.http;
	},
	load: function() {
		if (!jsh.test) jsh.test = {};
		if (!jsh.test.launcher) jsh.test.launcher = {};
		jsh.test.launcher.MockRemote = function(o) {
			if (!o) o = {};
			var tomcat = new jsh.httpd.Tomcat({});
			tomcat.map({
				//	TODO	works with or without leading slash; document this and write a test
				path: "",
				servlets: {
					"/*": {
						//	TODO	document load method
						load: function(scope) {
							scope.$exports.handle = function(request) {
								if (o.trace) {
									Packages.java.lang.System.err.println("Request: " + request.method + " " + request.headers.value("host") + " " + request.path);
								}
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
										var loader = new jsh.file.Loader({ directory: root });
										var HEAD = null;
										this.get = function(body,tokens) {
											var type = tokens.shift();
											if (type == "raw") {
												var version = tokens.shift();
												if (version == "local") {
													var path = tokens.join("/");
													var pathname = root.getRelativePath(path);
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
									if (tokenized.slice(0,2).join("/") == "api/1.0") {
										tokenized.shift();
										tokenized.shift();
										if (tokenized[0] == "repositories") {
											tokenized.shift();
											var user = tokenized[0];
											var repository = tokenized[1];
											tokenized.shift();
											tokenized.shift();
											if (o.src[user] && o.src[user][repository]) {
												var body = (request.method == "GET");
												return new Sourceroot(o.src[user][repository]).get(body, tokenized);
											} else {
												throw new Error("No definition for repository " + user + "/" + repository);
											}
										}
									} else if (o.src[tokenized[0]] && o.src[tokenized[0]][tokenized[1]] && tokenized[2] == "get") {
										var SRC = o.src[tokenized[0]][tokenized[1]];
										if (tokenized[3] == "local.zip") {
											try {
												var buffer = new jsh.io.Buffer();
												var to = buffer.writeBinary();
												var list = SRC.list({
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
												jsh.shell.echo("Error: " + e);
												jsh.shell.echo("Stack: " + e.stack);
												throw e;
											}
										}
									}
								} else if (request.headers.value("host") == "ftp.mozilla.org") {
									//	TODO	make it possible to reconstruct this from server information
									var url = "http://" + request.headers.value("host") + "/" + request.path;
									return new jsh.http.Client().request({
										url: url
									});
									return {
										status: { code: 500 }
									};
								} else {
									throw new Error("request.path = " + request.path);
									var resource = loader.resource(request.path);
									if (resource) {
										return {
											status: {
												code: 200
											},
											body: resource
										};
									}
								}
							}
						}
					}
				}
			});
			tomcat.start();
			var proxy = {
				http: {
					host: "127.0.0.1",
					port: tomcat.port
				}
			};
			var client = new jsh.http.Client({
				proxy: {
					http: {
						host: "127.0.0.1",
						port: tomcat.port
					}
				}
			});
			return new function() {
				this.client = client;

				this.jsh = function(o) {
					jsh.shell.jrunscript(jsh.js.Object.set({}, o, {
						properties: {
							"http.proxyHost": "127.0.0.1",
							"http.proxyPort": String(tomcat.port)
						},
						arguments: [
							"-e", "load('http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/rhino/jrunscript/api.js?jsh')",
							o.script
						].concat( (o.arguments) ? o.arguments : [] )
					}));
				}

				this.jrunscript = function(o) {
					var properties = {
						"http.proxyHost": "127.0.0.1",
						"http.proxyPort": String(tomcat.port)
					};
					jsh.js.Object.set(properties, (o.properties) ? o.properties : {});
					jsh.shell.jrunscript(jsh.js.Object.set({}, o, {
						properties: properties,
						arguments: (o.arguments) ? o.arguments : []
					}));
				}

				this.stop = function() {
					tomcat.stop();
				}
			}
		}
	}
})