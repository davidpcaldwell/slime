//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		jsh.shell.sudo({
			nocache: true,
			askpass: jsh.shell.jsh.src.getFile("rhino/shell/sudo-askpass.bash")
		}).run({
			command: "ls"
		});
		//	TODO	Why is the explicit exit needed?
		jsh.shell.exit(0);
	}
//@ts-ignore
)(jsh);
