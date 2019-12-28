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
				slime: new jsh.tools.git.Repository({ directory: jsh.shell.jsh.src })
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
