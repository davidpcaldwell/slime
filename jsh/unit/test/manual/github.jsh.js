//@ts-check

var parameters = jsh.script.getopts({
	options: {
		real: false
	}
});

var client = (function() {
	if (parameters.options.real) return new jsh.http.Client();
	var www = new jsh.unit.mock.Web();
	www.add(jsh.unit.mock.Web.github());
	return www.client;
})();

