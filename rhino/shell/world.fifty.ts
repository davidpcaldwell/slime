//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function(
		fifty: slime.fifty.test.Kit
	) {
		fifty.tests.safari = function() {
			var processes = fifty.global.jsh.shell.os.process.list().map(function(process) {
				return {
					id: process.id,
					parent: process.parent.id,
					command: process.command
				}
			});
			fifty.global.jsh.shell.console(JSON.stringify(processes,void(0),4));
		}
	}
//@ts-ignore
)(fifty);
