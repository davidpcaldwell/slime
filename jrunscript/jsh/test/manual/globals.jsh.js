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
		var global = (function() { return this; })();
		jsh.shell.console("Global: " + global);
		jsh.shell.console("Global properties: " + Object.keys(global).join(" "));
		jsh.shell.console("Map: " + String(global.Map));
		jsh.shell.console("WeakMap: " + String(global.WeakMap));
	}
//@ts-ignore
)($api,jsh);
