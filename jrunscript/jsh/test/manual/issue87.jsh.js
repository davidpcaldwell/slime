//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

var err = jsh.shell.stderr.character();
jsh.shell.echo("Hello, Long Way! (this works)", { stream: err });
jsh.shell.echo("Hello, World! (this does not work)", { stream: jsh.shell.stderr });
