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

var parameters = jsh.script.getopts({
	options: {
		test: String
	}
});

var tests = (parameters.options.test)
? {
	file: (parameters.options.test == "file"),
	url: (parameters.options.test == "url"),
	urlproperties: (parameters.options.test == "urlproperties"),
	filename: (parameters.options.test == "filename")
}
: {
	file: true,
	url: true,
	urlproperties: false
};

var SRC = jsh.script.file.parent.parent.parent.parent;
var tomcat = new jsh.httpd.Tomcat({});
tomcat.map({
	//	TODO	works with or without leading slash; document this and write a test
	path: "",
	servlets: {
		"/*": {
			//	TODO	document load method
			load: function(scope) {
				var JRUNSCRIPT = SRC.getSubdirectory("rhino/jrunscript");
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
									if (repository == "jrunscript") {
										return new Sourceroot(JRUNSCRIPT).get(tokenized);
									} else {
										var response =  new Sourceroot(SRC).get(tokenized);
//										jsh.shell.echo("response = " + response);
//										jsh.shell.echo("response.body.type = " + response.body.type);
//										jsh.shell.echo("response.body.string = " + response.body.string);
										return response;
									}
								}
							}
						}
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
		"-e", "load('http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/jrunscript/raw/local/api.js?bitbucket=slime@local:jsh/launcher/main.js')",
		SRC.getRelativePath("jsh/test/jsh.shell/echo.jsh.js")
	]
});
if (tests.url) jsh.shell.jrunscript({
	properties: {
		"http.proxyHost": "127.0.0.1",
		"http.proxyPort": String(tomcat.port)
	},
	arguments: [
		"-e", "load('http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/jrunscript/raw/local/api.js?bitbucket=slime@local:jsh/launcher/main.js')",
		"http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/" + "jsh/test/jsh.shell/echo.jsh.js"
	]
});
if (tests.urlproperties) jsh.shell.jrunscript({
	properties: {
		"http.proxyHost": "127.0.0.1",
		"http.proxyPort": String(tomcat.port)
	},
	arguments: [
		"-e", "load('http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/jrunscript/raw/local/api.js?bitbucket=slime@local:jsh/launcher/main.js')",
		"http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/" + "jsh/test/jsh.shell/properties.jsh.js"
	]
});
if (tests.filename) jsh.shell.jrunscript({
	properties: {
		"http.proxyHost": "127.0.0.1",
		"http.proxyPort": String(tomcat.port)
	},
	arguments: [
		"-e", "load('http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/jrunscript/raw/local/api.js?test=filename')",
	]
});
tomcat.stop();