//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2017 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		view: "console",
		serve: false,
		system: false,
		httptunnel: false,
		//	TODO	clone over https currently does not work
		https: false,
		pause: Number,
		part: String
	}
});

var server = new jsh.unit.mock.Web();
var bitbucket = {
	src: {
		user: {
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
	pause: parameters.options.pause,
	loopback: true
};
server.add(jsh.unit.mock.Web.bitbucket(bitbucket));
server.start();
//if (parameters.options.pause) {
//	jsh.shell.console("Pausing ...");
//	Packages.java.lang.Thread.currentThread().sleep(parameters.options.pause);
//}

if (parameters.options.serve) {
	var httpProxy = "-Dhttp.proxyHost=127.0.0.1 -Dhttp.proxyPort=" + server.port;
	var httpsProxy = "-Dhttps.proxyHost=127.0.0.1 -Dhttps.proxyPort=" + server.https.port;
	jsh.shell.console("jrunscript " + httpProxy +  + " rhino/jrunscript/api.js jsh https://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/local/jsh/test/jsh.shell/echo.jsh.js");
	jsh.shell.console("");
	jsh.shell.console("hg --config http_proxy.host=127.0.0.1:" + server.port);
	server.run();
}

jsh.java.tools.plugin.hg();
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

var hgconfig = {
	http: {
		"http_proxy.host": "127.0.0.1:" + server.port
	},
	https: {
		"http_proxy.host": "127.0.0.1:" + server.https.port
	}
};

suite.part("clone", {
	execute: function(scope,verify) {
		var remote = new hg.Repository({ url: "http://bitbucket.org/user/slime" });
		var tmp1 = jsh.shell.TMPDIR.createTemporary({ directory: true });
		verify(tmp1).getSubdirectory(".hg").is.type("null");
		remote.clone({ to: tmp1, config: hgconfig.http });
		verify(tmp1).getSubdirectory(".hg").is.type("object");

		if (parameters.options.https) {
			var sRemote = new hg.Repository({ url: "https://bitbucket.org/user/slime" });
			var tmp2 = jsh.shell.TMPDIR.createTemporary({ directory: true });
			verify(tmp2).getSubdirectory(".hg").is.type("null");
			sRemote.clone({ to: tmp2, config: hgconfig.https, debug: true, verbose: true });
			verify(tmp2).getSubdirectory(".hg").is.type("object");
		}
	}
});

suite.part("authorization", {
	execute: function(scope,verify) {
		var unauthorizedDirect = direct.request({
			url: "https://127.0.0.1:" + server.https.port + "/api/1.0/repositories/user/jshtest/raw/local/test/bitbucket.jsh.js",
			authorization: null
		});
		verify(unauthorizedDirect).status.code.is(401);

		var okDirect = direct.request({
			url: "https://127.0.0.1:" + server.https.port + "/api/1.0/repositories/user/jshtest/raw/local/test/bitbucket.jsh.js",
			authorization: new jsh.http.Authentication.Basic.Authorization({ user: "foo", password: "bar" })
		});
		verify(okDirect).status.code.is(200);

		var verifyApi = function(client,protocol) {
			var unauthorized = client.request({
				url: protocol + "://bitbucket.org/api/1.0/repositories/user/jshtest/raw/local/test/bitbucket.jsh.js",
				authorization: null
			});
			if (unauthorized.status.code == 400) {
				jsh.shell.console(unauthorized.headers.map(function(h) { return h.name + ": " + h.value; }).join("\n"));
				jsh.shell.console(unauthorized.body.type);
				jsh.shell.console(unauthorized.body.stream);
			}
			verify(unauthorized).status.code.is(401);
			var ok = client.request({
				url: protocol + "://bitbucket.org/api/1.0/repositories/user/jshtest/raw/local/test/bitbucket.jsh.js",
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

//	TODO	after -view chrome, does execution proceed?
jsh.unit.interface.create(suite, {
	view: parameters.options.view,
	path: (parameters.options.part) ? parameters.options.part.split("/") : []
});

jsh.shell.console("Stopping mock web ...");
server.stop();
jsh.shell.console("Stopped mock web.");
