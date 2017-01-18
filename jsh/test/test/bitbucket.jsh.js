var parameters = jsh.script.getopts({
	options: {
		view: "console",
		serve: false
	}
});

var server = new jsh.test.mock.Web();
var bitbucket = {
	src: {
		davidpcaldwell: {
			jshtest: {
				directory: jsh.script.file.parent.parent,
				access: {
					user: "foo",
					password: "bar"
				}
			},
			slime: {
				directory: jsh.shell.jsh.src
			}
		}
	}
};
server.add(jsh.test.mock.Web.bitbucket(bitbucket));
server.start();

if (parameters.options.serve) {
	jsh.shell.console("hg --config http_proxy.host=127.0.0.1:" + server.port);
	server.run();
}

var client = server.client;

var suite = new jsh.unit.Suite();

suite.part("authorization", {
	execute: function(scope,verify) {
		var unauthorized = client.request({
			url: "http://bitbucket.org/api/1.0/repositories/davidpcaldwell/jshtest/raw/local/test/bitbucket.jsh.js",
			authorization: null
		});
		verify(unauthorized).status.code.is(401);
		var ok = client.request({
			url: "http://bitbucket.org/api/1.0/repositories/davidpcaldwell/jshtest/raw/local/test/bitbucket.jsh.js",
			authorization: new jsh.http.Authentication.Basic.Authorization({ user: "foo", password: "bar" })
		});
		verify(ok).status.code.is(200);
	}
});

jsh.unit.interface.create(suite, {
	view: parameters.options.view
});
