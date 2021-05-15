//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

var src = jsh.script.file.parent.parent.parent.parent;
jsh.shell.console("src = " + src);
var repository = new jsh.tools.git.Repository({ directory: src });
jsh.shell.console("repository = " + repository);
var remote = repository.remote.getUrl({ name: "origin" });
jsh.shell.console("remote = " + remote);
