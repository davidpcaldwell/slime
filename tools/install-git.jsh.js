//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	TODO	re-implement in terms of plugin
try {
	jsh.tools.git.install();
} catch (e) {
	var isExpected = Boolean(e instanceof jsh.tools.git.install.GUI);
	if (isExpected) {
		jsh.shell.console(e.message);
	} else {
		jsh.shell.console(e);
		jsh.shell.console(e.stack);
	}
	jsh.shell.exit(1);
}
