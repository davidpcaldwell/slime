var parameters = jsh.script.getopts({
	options: {
		view: "console",
		serve: false,
		system: false,
		httptunnel: false
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
	},
	loopback: true
};
server.add(jsh.test.mock.Web.bitbucket(bitbucket));
server.start();

if (parameters.options.serve) {
	jsh.shell.console("hg --config http_proxy.host=127.0.0.1:" + server.port);
	server.run();
}

jsh.http.test.disableHttpsSecurity();

var direct = new jsh.http.Client();

var client = (function() {
	if (!parameters.options.https) return server.client;
	return (parameters.options.system) ? new jsh.http.Client() : server.https.client;
})();

if (parameters.options.system) {
	Packages.java.lang.System.setProperty("https.proxyHost","127.0.0.1");
	Packages.java.lang.System.setProperty("https.proxyPort",String( (parameters.options.httptunnel) ? server.port : server.https.port ));
}

var suite = new jsh.unit.Suite();

suite.part("authorization", {
	execute: function(scope,verify) {
		var unauthorizedDirect = direct.request({
			url: "https://127.0.0.1:" + server.https.port + "/api/1.0/repositories/davidpcaldwell/jshtest/raw/local/test/bitbucket.jsh.js",
			authorization: null
		});
		verify(unauthorizedDirect).status.code.is(401);
		
		var okDirect = direct.request({
			url: "https://127.0.0.1:" + server.https.port + "/api/1.0/repositories/davidpcaldwell/jshtest/raw/local/test/bitbucket.jsh.js",
			authorization: new jsh.http.Authentication.Basic.Authorization({ user: "foo", password: "bar" })
		});
		verify(okDirect).status.code.is(200);
		
		var verifyApi = function(client,protocol) {
			var unauthorized = client.request({
				url: protocol + "://bitbucket.org/api/1.0/repositories/davidpcaldwell/jshtest/raw/local/test/bitbucket.jsh.js",
				authorization: null
			});
			if (unauthorized.status.code == 400) {
				jsh.shell.console(unauthorized.headers.map(function(h) { return h.name + ": " + h.value; }).join("\n"));
				jsh.shell.console(unauthorized.body.type);
				jsh.shell.console(unauthorized.body.stream);
			}
			verify(unauthorized).status.code.is(401);
			var ok = client.request({
				url: protocol + "://bitbucket.org/api/1.0/repositories/davidpcaldwell/jshtest/raw/local/test/bitbucket.jsh.js",
				authorization: new jsh.http.Authentication.Basic.Authorization({ user: "foo", password: "bar" })
			});
			verify(ok).status.code.is(200);			
		}
		
		verifyApi(server.client,"http");
		//verifyApi(server.client,"https");
		//verifyApi(new jsh.http.Client(),"https");
		verifyApi(server.https.client,"https");
	}
});

jsh.unit.interface.create(suite, {
	view: parameters.options.view
});
