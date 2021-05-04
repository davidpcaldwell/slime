//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		jsh.shell.echo(jsh.ui.askpass.gui({ prompt: "Account password for " + jsh.shell.environment.USER + ":" }));
	}
//@ts-ignore
)(jsh);
