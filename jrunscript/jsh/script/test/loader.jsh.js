//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var loader = new jsh.script.Loader("../../../..");
		jsh.shell.console("loader = " + loader);
		var a = loader.module("loader/test/data/b/");
		jsh.shell.echo(JSON.stringify({
			submodule: {
				message: a.submodule.message
			}
		}));
	}
)();
