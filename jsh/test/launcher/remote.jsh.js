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

//	TODO	Use HTTPS to host the mock server; then protocol conditionals can be removed from rhino/jrunscript/api.js
//			See http://stackoverflow.com/questions/1511674/how-do-a-send-an-https-request-through-a-proxy-in-java

var parameters = jsh.script.getopts({
	options: {
		test: String
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

var tests = (parameters.options.test)
? {
	file: (parameters.options.test == "file"),
	url: (parameters.options.test == "url"),
	urlproperties: (parameters.options.test == "urlproperties"),
	filename: (parameters.options.test == "filename"),
	build: (parameters.options.test == "build")
}
: {
	file: true,
	url: true,
	urlproperties: false,
	filename: false,
	build: false
};

var SRC = jsh.script.file.parent.parent.parent.parent;
if (!jsh.httpd.Tomcat) {
	//	TODO	should we pre-install a version of the Tomcat constructor that throws this exception?
	throw new Error("Tomcat not installed.");
}
var tomcat = new jsh.httpd.Tomcat({});
tomcat.map({
	//	TODO	works with or without leading slash; document this and write a test
	path: "",
	servlets: {
		"/*": {
			//	TODO	document load method
			load: function(scope) {
				var loader = new jsh.file.Loader({ directory: SRC });
				scope.$exports.handle = function(request) {
					if (request.headers.value("host") == "bitbucket.org") {
						//Packages.java.lang.System.err.println("Request path: " + request.path);
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
							this.get = function(tokens) {
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
												body: loader.resource(path)
											}
										} else if (pathname.directory) {
											//Packages.java.lang.System.err.println("Directory: " + pathname);
											return {
												status: {
													code: 200
												},
												body: {
													type: "text/plain",
													string: (function() {
														return pathname.directory.list({ type: pathname.directory.list.ENTRY }).map(function(entry) {
															//Packages.java.lang.System.err.println("Path: " + entry.path);
															return entry.path.replace(String(Packages.java.io.File.separator),"/");
														}).filter(function(path) {
															return path != ".hg/";
														}).join("\n");
													})()
												}
											}
										} else {
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
								if (user == "davidpcaldwell") {
									if (repository == "slime") {
										return new Sourceroot(SRC).get(tokenized);
									}
								}
							}
						} else if (tokenized[0] == "davidpcaldwell" && tokenized[1] == "slime" && tokenized[2] == "get") {
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

if (true) {
	var proxy = {
		http: {
			host: "127.0.0.1",
			port: tomcat.port
		}
	};
	var client = new jsh.http.Client({
		proxy: proxy
	});
	if (false) {
		var string = client.request({
			proxy: proxy,
			url: "http://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/local/jsh/",
			evaluate: function(response) {
				return response.body.stream.character().asString();
			}
		});
		var string = client.request({
			proxy: proxy,
			url: "http://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/local/jsh/etc/api.js",
			evaluate: function(response) {
				return response.body.stream.character().asString();
			}
		});
	}
	if (false) {
		var string = client.request({
			proxy: proxy,
			url: "http://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/local/loader/rhino/inonit/",
			evaluate: function(response) {
				return response.body.stream.character().asString();
			}
		});
	}
	if (false) {
		string = client.request({
			proxy: proxy,
			url: "http://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/local/jsh/loader/rhino.js",
			evaluate: function(response) {
				return response.body.stream.character().asString();
			}
		});
	}
	if (string) jsh.shell.echo(string);
}

if (tests.file) jsh.shell.jrunscript({
	properties: {
		"http.proxyHost": "127.0.0.1",
		"http.proxyPort": String(tomcat.port)
	},
	arguments: [
		"-e", "load('http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/rhino/jrunscript/api.js?jsh')",
		SRC.getRelativePath("jsh/test/jsh.shell/echo.jsh.js")
	]
});
if (tests.url) jsh.shell.jrunscript({
	properties: {
		"http.proxyHost": "127.0.0.1",
		"http.proxyPort": String(tomcat.port)
	},
	arguments: [
		"-e", "load('http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/rhino/jrunscript/api.js?jsh')",
		"http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/" + "jsh/test/jsh.shell/echo.jsh.js"
	]
});
if (tests.urlproperties) jsh.shell.jrunscript({
	properties: {
		"http.proxyHost": "127.0.0.1",
		"http.proxyPort": String(tomcat.port)
	},
	arguments: [
		"-e", "load('http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/rhino/jrunscript/api.js?jsh')",
		"http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/" + "jsh/test/jsh.shell/properties.jsh.js"
	]
});
if (tests.filename) jsh.shell.jrunscript({
	properties: {
		"http.proxyHost": "127.0.0.1",
		"http.proxyPort": String(tomcat.port)
	},
	arguments: [
		"-e", "load('http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/rhino/jrunscript/api.js?test=filename')",
	]
});
if (tests.build) {
	(function() {
		//	TODO	this is a pretty common idiom; should be a shorter call
		var destination = jsh.shell.TMPDIR.createTemporary({ directory: true });
		var args = parameters.arguments.map(function(s) {
			if (s == "-build:test") return "-test";
			return s;
		});
		jsh.shell.jrunscript({
			properties: {
				"http.proxyHost": "127.0.0.1",
				"http.proxyPort": String(tomcat.port)
			},
			arguments: [
				"-e", "load('http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/rhino/jrunscript/api.js?jsh')",
				"http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/" + "jsh/etc/build.jsh.js",
				String(destination)
			].concat(args)
		});
	})();
}
tomcat.stop();