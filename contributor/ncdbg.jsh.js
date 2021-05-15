//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

var src = jsh.script.file.parent.parent;
jsh.shell.jsh({
	shell: src,
	script: src.getFile("jsh/tools/ncdbg.jsh.js"),
	//	TODO	switch to function(list)
	// arguments: function(list) {
	// 	list.push("-ncdbg:chrome:instance", src.getRelativePath("local/chrome/ncdbg.jsh.js"))
	// }
	arguments: [
		"-ncdbg:chrome:instance", src.getRelativePath("local/chrome/ncdbg.jsh.js")
	]
});
