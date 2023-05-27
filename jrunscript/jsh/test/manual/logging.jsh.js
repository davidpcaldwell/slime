//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

jsh.loader.plugins(jsh.script.file.getRelativePath("../../../js/debug"));
jsh.shell.echo(jsh.java.log);
jsh.java.log.named("it");
jsh.java.log.named("it").INFO("it is %s", "awesome");
