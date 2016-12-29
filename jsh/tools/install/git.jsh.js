//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if (jsh.shell.os.name == "Mac OS X") {
	if (!jsh.file.Pathname("/Applications/Xcode.app").directory && !jsh.file.Pathname("/Library/Developer/CommandLineTools")) {
		jsh.shell.console("Install Apple's command line developer tools.");
		jsh.shell.run({
			command: "/usr/bin/git"
		});
		jsh.shell.exit(1);
	}
	jsh.shell.console("Git already installed.");
} else {
	throw new Error("Unimplemented: operating system [" + jsh.shell.os.name + "]");
}