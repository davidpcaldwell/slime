//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,$api,jsh) {
		jsh.shell.console("Worker script executing! thread = " + Packages.java.lang.Thread.currentThread());
		jsh.loader.worker.onmessage(function(e) {
			jsh.shell.console("Worker script got message: " + JSON.stringify(e));
			jsh.loader.worker.postMessage(e.detail*2);
		});
		jsh.shell.console("Worker script end.");
	}
//@ts-ignore
)(Packages,$api,jsh);
