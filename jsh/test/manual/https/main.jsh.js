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
	 */
	function($api,jsh) {
		var port = jsh.ip.getEphemeralPort().number;
		var invocation = jsh.script.cli.invocation(
			$api.Function.pipe(
				jsh.script.cli.option.pathname({ longname: "keystore" }),
				jsh.script.cli.option.string({ longname: "password" })
			)
		)
		var tomcat = jsh.httpd.Tomcat({
			https: {
				port: port,
				keystore: {
					file: invocation.options.keystore.file,
					password: invocation.options.password
				}
			}
		});
		tomcat.start();
		tomcat.run();
	}
//@ts-ignore
)($api,jsh);
