var parameters = jsh.script.getopts({
	options: {
		view: "console"
	}
});

var server = new jsh.test.mock.Internet();
server.add(jsh.test.mock.Internet.bitbucket({
	src: {
		davidpcaldwell: {
			jshtest: {
				directory: jsh.script.file.parent.parent,
				access: {
					user: "foo",
					password: "bar"
				}
			}
		}
	}
}));

server.start();

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
