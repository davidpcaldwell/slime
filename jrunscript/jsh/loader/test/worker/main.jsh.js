//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,jsh) {
		Packages.java.lang.System.err.println("Main script executing! thread = " + Packages.java.lang.Thread.currentThread());
		var worker = jsh.loader.worker.create({
			script: jsh.script.file.parent.getFile("worker.jsh.js"),
			arguments: [],
			onmessage: function(e) {
				jsh.shell.console("main script got message from worker " + JSON.stringify(e));
				worker.terminate();
				jsh.shell.console("Worker terminated.");
				jsh.shell.echo(e.detail);
			}
		});
		jsh.shell.console("Created worker: " + worker);
		worker.postMessage(2);
	}
//@ts-ignore
)(Packages,jsh)
