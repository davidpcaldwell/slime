//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	This test presently does not work as intended -- the characters that are not supposed to echo echo.
//
jsh.shell.run({
	command: jsh.script.file.parent.getFile("console-input-without-echo.bash"),
	stdio: {
		input: jsh.shell.stdio.input
	}
});
