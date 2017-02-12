//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2017 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		view: "console"
	}
});

jsh.loader.plugins(jsh.shell.jsh.src.getRelativePath("jsh/test/launcher"));

var bb = new jsh.test.launcher.MockRemote({
	src: {
		davidpcaldwell: {
			provision: {
				directory: jsh.script.file.parent.parent
			}
		}
	},
	trace: true
});

var suite = new jsh.unit.Suite();

suite.part("mock", {
	execute: function(scope,verify) {
//		var client = bb.client;

		var url = "http://bitbucket.org/api/1.0/repositories/davidpcaldwell/provision/raw/local/test/application.bash";

		var output = jsh.shell.run({
			command: "curl",
			arguments: [
				url
			],
			environment: jsh.js.Object.set({}, jsh.shell.environment, {
				http_proxy: "http://127.0.0.1:" + bb.port
			}),
			stdio: {
				output: String
			},
			evaluate: function(result) {
				return result.stdio.output;
			}
		});
		verify(output.substring(0,4)).is("jsh ");
	}
});

jsh.unit.interface.create(suite, { view: parameters.options.view });