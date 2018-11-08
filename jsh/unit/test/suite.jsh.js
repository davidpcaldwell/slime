//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2018 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		view: "console"
	}
})

var suite = new jsh.unit.Suite({
	parts: {
		scenario: new jsh.unit.Suite.Fork({
			run: jsh.shell.jsh,
			shell: jsh.shell.jsh.src,
			script: jsh.script.file.parent.getFile("scenario.jsh.js"),
			arguments: [
				"-view", "stdio"
			]
		})
	}
})

jsh.unit.interface.create(suite, {
	view: parameters.options.view
});
