//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,jsh) {
		Packages.java.lang.System.err.println("Main script executing! thread = " + Packages.java.lang.Thread.currentThread());
		var worker = jsh.loader.worker({
			script: jsh.script.file.parent.getFile("worker.jsh.js"),
			arguments: [],
			onmessage: function(e) {
				jsh.shell.console("Got event " + e.type);
			}
		});
		jsh.shell.console("Created worker: " + worker);
	}
//@ts-ignore
)(Packages,jsh)