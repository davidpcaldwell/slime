//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin(new function() {
	var program;

	this.isReady = function() {
		return Boolean(jsh.shell.PATH.getCommand("hg"));
	};

	this.load = function() {
		if (!global.jsh.tools) global.jsh.tools = {};
		global.jsh.tools.hg = $loader.module("module.js", {
			api: {
				js: jsh.js,
				web: jsh.js.web,
				java: jsh.java,
				io: jsh.io,
				ip: jsh.ip,
				file: jsh.file,
				shell: jsh.shell,
				time: jsh.time
			},
			install: jsh.shell.PATH.getCommand("hg")
		});
		global.hg = global.jsh.tools.hg;
		$api.deprecate(global,"hg");
	}
});