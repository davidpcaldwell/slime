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
		jsh.shell.tools.rhino.require.simple();
		$api.fp.world.execute(jsh.shell.tools.node.require());
		var node = jsh.shell.tools.node.installed;
		//	TODO	this API could use better documentation, struggled to get this right
		node.run({
			arguments: [jsh.script.file.parent.getRelativePath("main.js").toString()].concat(jsh.script.arguments)
		});
	}
//@ts-ignore
)($api,jsh);
