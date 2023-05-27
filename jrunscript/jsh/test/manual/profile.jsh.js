//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

jsh.debug.profile.cpu();
jsh.debug.profile.add(jsh.shell,"jsh.shell");
debugger;
jsh.shell.echo("Hello, World!");
jsh.debug.profile.cpu.dump({
	indent: "  ",
	log: function(s) {
		jsh.shell.echo(s);
	}
});
