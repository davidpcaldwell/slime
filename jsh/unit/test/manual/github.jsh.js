//@ts-check

var token = jsh.script.file.parent.parent.parent.parent.parent.getRelativePath("local/github/token");

if (!token.file) throw new Error("No token file.");

var parameters = jsh.script.getopts({
	options: {
		real: false,
		user: String
	}
});

var client = (function() {
	if (parameters.options.real) {
		if (!parameters.options.user) {
			jsh.shell.console("Required: -user");
			jsh.shell.exit(1);
		}

		var auth = jsh.http.Authentication.Basic.Authorization({ user: parameters.options.user, password: token.file.read(String) })
		return new jsh.http.Client({
			authorization: auth
		});
	}
	var www = new jsh.unit.mock.Web({ trace: true });
	www.add(jsh.unit.mock.Web.github({
		src: {
			davidpcaldwell: {
				slime: jsh.tools.git.Repository({ directory: jsh.shell.jsh.src })
			}
		}
	}));
	www.start();
	jsh.http.test.disableHttpsSecurity();
	return www.https.client;
})();

var launcher = client.request({
	url: "https://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh.bash"
});
jsh.shell.console(launcher.body.type);
jsh.shell.console(launcher.body.stream.character().asString());

var sources = client.request({
	url: "https://api.github.com/repos/davidpcaldwell/slime/contents/loader/jrunscript/java/",
	evaluate: function(response) {
		jsh.shell.console("Content type: " + response.body.type);
		var string = response.body.stream.character().asString();
		jsh.shell.console(string);
		return JSON.parse(string);
	}
});
jsh.shell.console(JSON.stringify(sources, void(0), "    "));

var plugins = client.request({
	url: "https://api.github.com/repos/davidpcaldwell/slime/contents/local/jsh/plugins/",
	evaluate: function(response) {
		jsh.shell.console("Response code: " + response.status.code);
		jsh.shell.console("Content type: " + response.body.type);
		var string = response.body.stream.character().asString();
		jsh.shell.console(string);
		return JSON.parse(string);
	}
});
jsh.shell.console(JSON.stringify(plugins, void(0), "    "));
