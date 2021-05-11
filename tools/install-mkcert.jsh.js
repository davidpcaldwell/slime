//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		//	TODO	deal with Firefox
		//	TODO	deal with Java
		var invocation = jsh.script.cli.invocation(
			$api.Function.pipe(
				jsh.script.cli.option.pathname({ longname: "destination" })
			)
		);

		var at = jsh.tools.install.get({ url: "https://github.com/FiloSottile/mkcert/releases/download/v1.4.3/mkcert-v1.4.3-darwin-amd64" });

		at.copy(invocation.options.destination, {
			filter: function(p) {
				return true;
			},
			recursive: true
		});
		jsh.shell.console("Installed mkcert to: " + invocation.options.destination);
		jsh.shell.run({
			command: "chmod",
			arguments: [
				"+x", invocation.options.destination
			]
		});
	}
//@ts-ignore
)($api,jsh);
