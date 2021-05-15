//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

var v = jsh.loader.value(jsh.script.file.parent.getRelativePath("jsh.loader.value.js"));
jsh.shell.echo(JSON.stringify(v));
