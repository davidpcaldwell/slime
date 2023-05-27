//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		jsh.script.cli.wrap({
			commands: {
				status: function(p) {
					if (p.arguments.length == 0) return 0;
					if (p.arguments.length > 1) return -1;
					return Number(p.arguments[0]);
				}
			}
		});
	}
//@ts-ignore
)(jsh);
