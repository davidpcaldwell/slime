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

var variables = [];
for (var x in www.environment) {
	variables.push({ name: x, value: www.environment[x] });
}
var command = (function() {
	var rv = [];
	rv.push("env");
	rv.push.apply(rv, variables.map(function(v) {
		return v.name + "=" + v.value;
	}));
	rv.push("curl");
	rv.push("http://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh.bash")
	return rv;
})();

jsh.shell.console("curl " + "https://127.0.0.1:" + www.https.port + "/" + "davidpcaldwell/slime/master/jsh.bash");

jsh.shell.console(command.join(" ") + " | " + "env JSH_HTTP_PROXY_HOST=127.0.0.1 JSH_HTTP_PROXY_PORT=" + www.port + " bash -s");
www.run();
