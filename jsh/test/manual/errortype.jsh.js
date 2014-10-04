//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var Unimplemented = jsh.js.Error.Type("Unimplemented");

try {
	throw new Unimplemented("Not implemented.");
} catch (e) {
	jsh.shell.echo("toString: " + e.toString());
	jsh.shell.echo("Error?: " + Boolean(e instanceof Error));
	jsh.shell.echo("Unimplemented?: " + Boolean(e instanceof Unimplemented));
	jsh.shell.echo("name: " + e.name);
	jsh.shell.echo("message: " + e.message);
	jsh.shell.echo("stack: " + e.stack);
}

