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
	 * @param { slime.jrunscript.bootstrap.Context } $context
	 * @param { slime.runtime.loader.Store } $loader
	 * @param { slime.loader.Export<slime.jrunscript.bootstrap.Exports> } $export
	 */
	function(Packages,JavaAdapter,$api,$context,$loader,$export) {
		/** @type { slime.js.Cast<slime.jrunscript.bootstrap.Exports> } */
		var after = $api.fp.cast.unsafe;
		var jrunscript = {
			$api: {
				debug: ($context.debug) ? function(message) {
					Packages.java.lang.System.err.println("SLIME JRUNSCRIPT BOOTSTRAP EMBED: " + message);
				} : false,
				script: $context.script,
				arguments: ["api"]
			},
			load: function() {
				//	TODO	we can probably implement load() using $loader ...
				//jsh.shell.console("load(" + Array.prototype.slice.call(arguments) + ")");
			},
			Packages: Packages,
			JavaAdapter: JavaAdapter,
			readFile: void(0),
			readUrl: void(0),
			Java: void(0)
		};
		$loader.run("api.js", {}, jrunscript);
		$export(after(jrunscript.$api));
	}
//@ts-ignore
)(Packages,JavaAdapter,$api,$context,$loader,$export);
