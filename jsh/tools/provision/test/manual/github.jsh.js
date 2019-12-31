var parameters = jsh.script.getopts({
	options: {
		echoHttpCalls: false
	}
});

var www = new jsh.unit.mock.Web({ trace: parameters.options.echoHttpCalls });
www.add(jsh.unit.mock.Web.github({
	src: {
		davidpcaldwell: {
			slime: new jsh.tools.git.Repository({ directory: jsh.shell.jsh.src })
		}
	}
}));
www.start();
jsh.http.test.disableHttpsSecurity();

var toEnvArguments = function(o) {
	return 	$api.Object.properties(o).map(function(property) {
		return property.name + "=" + property.value
	});
};

var getCommand = function(p) {
	if (!p) p = {};
	if (!p.environment) p.environment = {};
	var variables = [];
	for (var x in www.environment) {
		variables.push({ name: x, value: www.environment[x] });
	}
	$api.Object.properties(p.environment).forEach(function(property) {
		variables.push({ name: property.name, value: property.value });
	});
	var rv = [];
	rv.push("env");
	rv.push.apply(rv, variables.map(function(v) {
		return v.name + "=" + v.value;
	}));
	rv.push("curl");
	rv.push("http://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh.bash")
	return rv;
};

//	jsh.shell.console("curl " + "https://127.0.0.1:" + www.https.port + "/" + "davidpcaldwell/slime/master/jsh.bash");

var githubUser = "davidpcaldwell";
var githubToken = jsh.shell.jsh.src.getFile("local/github/token").read(String);
var githubBasicAuthorization = githubUser + ":" + githubToken;
jsh.shell.console("Test with mock GitHub: ");
jsh.shell.console(
	getCommand().join(" ")
	+ " |"
	+ " env"
	+ " JSH_HTTP_PROXY_HOST=127.0.0.1 JSH_HTTP_PROXY_PORT=" + www.port + " JSH_LAUNCHER_GITHUB_PROTOCOL=http"
	+ " JSH_GITHUB_API_PROTOCOL=http"
	+ " bash -s " + "http://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh/test/jsh-data.jsh.js"
);
jsh.shell.console("");
jsh.shell.console("Test launcher with mock GitHub, loader with GitHub:");
jsh.shell.console(
	getCommand().join(" ")
	+ " |"
	+ " env"
	+ " JSH_HTTP_PROXY_HOST=127.0.0.1 JSH_HTTP_PROXY_PORT=" + www.port + " JSH_LAUNCHER_GITHUB_PROTOCOL=http"
	+ " JSH_SHELL_SRC=https://raw.githubusercontent.com/davidpcaldwell/slime/master/"
	+ " " + toEnvArguments({ JSH_GITHUB_USER: githubUser, JSH_GITHUB_PASSWORD: githubToken, JSH_LOADER_NOPROXY: "true" }).join(" ")
	+ " bash -s https://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh/test/jsh-data.jsh.js"
);
jsh.shell.console("");
jsh.shell.console("Test on GitHub: ");
jsh.shell.console(
	(function() {
		var rv = [];
		rv.push("curl");
		rv.push("-u", githubBasicAuthorization);
		//	TODO	with -L, specifying http:// below would work properly via redirection
		rv.push("https://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh.bash");
		return rv;
	})().join(" ") + " | bash -s https://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh/test/jsh-data.jsh.js"
)
www.run();
