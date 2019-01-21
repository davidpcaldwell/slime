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
		test: String,
		script: jsh.file.Pathname,
		jrunscript: jsh.script.getopts.ARRAY(jsh.file.Pathname),
		log: false,
		"trace:server": false
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

if (!jsh.unit || !jsh.unit.mock || !jsh.unit.mock.Web) {
	var base = jsh.script.file.parent.parent.parent.parent;
	jsh.loader.plugins(base.getRelativePath("loader/api"));
	jsh.loader.plugins(base.getRelativePath("jsh/unit"));
}
jsh.loader.plugins(jsh.script.file.parent.pathname);

var SRC = jsh.script.file.parent.parent.parent.parent;

if (parameters.options.jrunscript.length) {
	var args = parameters.arguments;
	if (parameters.options.test) {
		args.push("-test", parameters.options.test);
	}
	if (parameters.options.script) {
		args.push("-script", parameters.options.script);
	}
	parameters.options.jrunscript.forEach(function(version) {
		jsh.shell.echo("version: " + version);
		jsh.shell.run({
			command: version,
			arguments: [
				SRC.getRelativePath("rhino/jrunscript/api.js"),
				"jsh",
				jsh.script.file.pathname
			].concat(args)
		});
	});
	jsh.shell.exit(0);
} else {
	var properties = {};
	if (parameters.options.log) {
		properties["java.util.logging.config.file"] = jsh.script.file.parent.getRelativePath("http.logging.properties");
	}
	var mock = new jsh.test.launcher.MockRemote({
		src: {
			davidpcaldwell: {
				slime: {
					directory: SRC
				}
			}
		},
		trace: parameters.options["trace:server"]
	});
	jsh.shell.console("Mock port is " + mock.port);
	if (parameters.options.script) {
		var environment = jsh.js.Object.set(
			{},
			jsh.shell.environment,
			(parameters.options.log) ? { JSH_LOG_JAVA_PROPERTIES: jsh.script.file.parent.getRelativePath("http.logging.properties").toString() } : {}
		);
		mock.jsh({
			properties: properties,
			environment: environment,
			script: parameters.options.script,
			arguments: parameters.arguments,
			evaluate: function(result) {
				jsh.shell.exit(result.status);
			}
		});
	}

	var all = (parameters.options.test == "all");
	var tests = (parameters.options.test)
	? {
		file: (parameters.options.test == "file" || all),
		url: (parameters.options.test == "url" || all),
		urlproperties: (parameters.options.test == "urlproperties" || all),
		filename: (parameters.options.test == "filename" || all),
		build: (parameters.options.test == "build" || all),
		subshell: (parameters.options.test == "subshell" || all)
	}
	: {
		file: true,
		url: true,
		urlproperties: false,
		filename: false,
		build: false,
		subshell: false
	};

	var client = mock.client;

	if (true) {
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
				url: "http://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/local/loader/jrunscript/inonit/",
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

	if (tests.file) {
		jsh.shell.console("Executing file test ...");
		mock.jsh({
			script: SRC.getRelativePath("jsh/test/jsh.shell/properties.jsh.js"),
			properties: properties
		});
	}

	if (tests.url) {
		jsh.shell.console("Executing url test ...", { stream: jsh.shell.stdio.error });
		mock.jsh({
			script: "http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/" + "jsh/test/jsh.shell/properties.jsh.js"
		});
	}

	if (tests.urlproperties) {
		mock.jsh({
			script: "http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/" + "jsh/test/jsh.shell/properties.jsh.js",
			properties: properties
		});
	}

	if (tests.filename) mock.jrunscript({
		arguments: [
			"-e", "load('http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/rhino/jrunscript/api.js?test=filename')",
		]
	});
	if (tests.build) {
		//	TODO	as of this writing, this test fails
		(function() {
			//	TODO	this is a pretty common idiom; should be a shorter call
			var destination = jsh.shell.TMPDIR.createTemporary({ directory: true });
			var args = parameters.arguments.map(function(s) {
				if (s == "-build:test") return "-test";
				return s;
			});
			mock.jrunscript({
				properties: {
					"jsh.engine.rhino.classpath" : (jsh.shell.rhino && jsh.shell.rhino.classpath) ? String(jsh.shell.rhino.classpath) : ""
				},
				arguments: [
					"-e", "load('http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/rhino/jrunscript/api.js?jsh/install')",
	//				"http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/" + "jsh/etc/build.jsh.js",
					String(destination)
				].concat(args)
			});
		})();
	}
	if (tests.subshell) {
		mock.jsh({
			script: "http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/" + "jsh/test/manual/remote-jsh.shell.jsh.jsh.js"
		});
//		jsh.shell.jrunscript({
//			properties: {
//				"http.proxyHost": "127.0.0.1",
//				"http.proxyPort": String(tomcat.port)
//			},
//			arguments: [
//				"-e", "load('http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/rhino/jrunscript/api.js?jsh')",
//				"http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/" + "jsh/test/manual/remote-jsh.shell.jsh.jsh.js"
//			]
//		});
	}
	mock.stop();
}