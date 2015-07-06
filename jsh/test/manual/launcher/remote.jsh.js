var tomcat = new jsh.httpd.Tomcat({});
tomcat.map({
	//	TODO	works with or without leading slash; document this and write a test
	path: "",
	servlets: {
		"/*": {
			//	TODO	document load method
			load: function(scope) {
				var SRC = jsh.script.file.parent.parent.parent.parent.parent;
				var JRUNSCRIPT = SRC.getSubdirectory("rhino/jrunscript");
				var loader = new jsh.file.Loader({ directory: SRC });
				scope.$exports.handle = function(request) {
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
							this.get = function(tokens) {
								var type = tokens.shift();
								if (type == "raw") {
									var version = tokens.shift();
									if (version == "local") {
										var path = tokens.join("/");
										var pathname = root.getRelativePath(path);
										if (pathname.file) {
											return {
												status: {
													code: 200
												},
												body: loader.resource(path)
											}
										} else if (pathname.directory) {
											return {
												status: {
													code: 200
												},
												body: {
													type: "text/plain",
													string: (function() {
														return pathname.directory.list({ type: pathname.directory.list.ENTRY }).map(function(entry) {
															return entry.path;
														}).join("\n");
													})()
												}
											}
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
	jsh.shell.echo(string);
}

jsh.shell.jrunscript({
	properties: {
		"http.proxyHost": "127.0.0.1",
		"http.proxyPort": String(tomcat.port)
	},
	arguments: [
//		"-e", "load('http://bitbucket.org/" + "/rhino/jrunscript/api.js?relative=../../jsh/launcher/rhino/main.js')"
		"-e", "load('http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/jrunscript/raw/local/api.js?bitbucket=slime@local:jsh/launcher/rhino/main.js')"
	]
});
tomcat.stop();