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
		var tomcat = new jsh.httpd.Tomcat({
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
