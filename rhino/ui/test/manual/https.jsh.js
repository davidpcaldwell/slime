//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		var httpsPort = jsh.ip.getEphemeralPort().number;

		//	Does not work as of Chrome 96 without mkcert because Chrome treats page as untrusted with default SLIME HTTPS setup

		var keystore = jsh.shell.TMPDIR.createTemporary({ suffix: ".p12" }).pathname;

		var mkcert = jsh.shell.tools.mkcert.require();

		//	Does not work as of Chrome 96 without 127.0.0.1 since that is where hostrule proxies the request
		mkcert.pkcs12({ to: keystore, hosts: ["127.0.0.1", "it.is.awesome"] });

		jsh.ui.application({
			https: {
				port: httpsPort,
				keystore: (keystore) ? {
					file: keystore.file,
					password: "changeit"
				} : void(0)
			},
			resources: jsh.script.loader,
			servlet: {
				load: function(scope) {
					scope.$exports.handle = function(request) {
						jsh.shell.console("Received request: " + request.path);
						return {
							status: {
								code: 200
							},
							body: {
								type: "application.json",
								string: JSON.stringify({
									path: request.path
								})
							}
						};
					}
				}
			},
			//	TODO	should be able to omit if empty
			parameters: {},
			browser: {
				chrome: {
					browser: true,
					hostrules: [
						"MAP it.is.awesome 127.0.0.1:" + httpsPort
					]
				}
			},
			url: "https://it.is.awesome/pathpath"
		});
	}
//@ts-ignore
)($api,jsh);
