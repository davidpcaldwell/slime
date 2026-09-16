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
		var invocation = jsh.internal.bootstrap.jsh.invocation.fromSystemProperties();
		jsh.shell.console(JSON.stringify(invocation,void(0),4));
	}
//@ts-ignore
)($api,jsh);
