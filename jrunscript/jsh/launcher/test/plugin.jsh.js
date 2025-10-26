//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.plugin.Scope["plugin"] } plugin
	 */
	function($api,jsh,plugin) {
		plugin({
			isReady: function() {
				return Boolean(jsh.httpd && jsh.httpd.Tomcat && jsh.http && jsh.unit && jsh.unit.mock && jsh.unit.mock.Web);
			},
			load: function() {
				if (!jsh.test) jsh.test = {
					relaunchInDebugger: void(0),
					Suite: void(0),
					integration: void(0),
					requireBuiltShell: void(0),
					mock: void(0),
					launcher: void(0)
				};
				if (!jsh.test.launcher) jsh.test.launcher = {};
				jsh.test.launcher.MockRemote = function(o) {
					var delegate = jsh.unit.mock.Web();
					delegate.add(jsh.unit.mock.web.Bitbucket({
						src: o.src
					}));
					delegate.add(function(request) {
						//	TODO	basically we are proxying the below and should create an API for it
						if (request.headers.value("host") == "ftp.mozilla.org") {
							//	TODO	make it possible to reconstruct this from server information
							var url = "http://" + request.headers.value("host") + "/" + request.path;
							return new jsh.http.Client().request({
								url: url
							});
							return {
								status: { code: 500 }
							};
						}
					});
					delegate.start();
					return new function() {
						this.port = delegate.port;

						this.client = delegate.client;

						this.jsh = function(o) {
							return this.jrunscript(jsh.js.Object.set({}, o, {
								arguments: [
									"-e", "load('http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/rhino/jrunscript/api.js?jsh')",
									o.script
								].concat( (o.arguments) ? o.arguments : [] )
							}));
						}

						//	TODO	https?

						this.jrunscript = function(o) {
							var properties = {
								"http.proxyHost": "127.0.0.1",
								"http.proxyPort": String(delegate.port)
							};
							jsh.js.Object.set(properties, (o.properties) ? o.properties : {});
							return jsh.shell.jrunscript.old(jsh.js.Object.set({}, o, {
								properties: properties,
								arguments: (o.arguments) ? o.arguments : []
							}));
						}

						this.stop = function() {
							delegate.stop();
						}
					}
				}
			}
		})

	}
//@ts-ignore
)($api,$context,$export);
