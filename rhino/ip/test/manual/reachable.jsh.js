//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var parameters = jsh.script.getopts({
			options: {
				host: String
			}
		});

		var h = new jsh.ip.Host({ name: parameters.options.host });
		jsh.shell.echo("Reachable (" + parameters.options.host + "): " + h.isReachable());
	}
)();
