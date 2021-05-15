//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

jsh.shell.echo(JSON.stringify({
	src: (jsh.shell.jsh.src) ? jsh.shell.jsh.src.toString() : void(0),
	home: (jsh.shell.jsh.home) ? jsh.shell.jsh.home.toString() : void(0),
	url: (jsh.shell.jsh.url) ? jsh.shell.jsh.url.toString() : void(0),
	lib: (jsh.shell.jsh.lib) ? jsh.shell.jsh.lib.toString() : void(0)
}));
