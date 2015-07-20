//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		child: false
	}
});

jsh.shell.echo("STARTING");
var _random = new Packages.java.util.Random();

var emitStringSlowly = function(string,to) {
	for (var i=0; i<string.length; i++) {
		to.write(string[i]);
		Packages.java.lang.Thread.sleep(25*_random.nextDouble());
	}
	to.write(String(Packages.java.lang.System.getProperty("line.separator")));
}
jsh.java.Thread.start(function() {
	emitStringSlowly("ABCDEFGHIJKLMNOPQRSTUVWXYZ", jsh.shell.stdio.output);
});
jsh.java.Thread.start(function() {
	emitStringSlowly("abcdefghijklmnoprstuvwxyz", jsh.shell.stdio.error);
});

