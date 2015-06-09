//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/shell SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var ps = (jsh.shell.os.process && jsh.shell.os.process.list) ? jsh.shell.os.process.list() : void(0);
if (ps) {
	for (var i=0; i<ps.length; i++) {
		jsh.shell.echo("Process ID: " + ps[i].id + " parent: " + ps[i].parent.id);
		jsh.shell.echo("Command: " + ps[i].command);
		jsh.shell.echo();
	}
} else {
	jsh.shell.echo("ps not implemented for this platform.");
}