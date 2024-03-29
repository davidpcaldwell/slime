//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

jsh.shell.jsh({
	fork: true,
	script: jsh.script.file.getRelativePath("jsh.unit.html.Scenario.jsh.js")
});
jsh.shell.jsh({
	fork: true,
	script: jsh.script.file.getRelativePath("jsh.unit.html.Scenario.jsh.js"),
	arguments: ["-mode","stdio.parent"]
});
jsh.shell.jsh({
	fork: true,
	script: jsh.script.file.getRelativePath("../unit.jsh.js")
});
throw new Error("The below code is gone, and there is currently no equivalent.");
jsh.shell.jsh({
	fork: true,
	script: jsh.script.file.getRelativePath("../../unit/browser.jsh.js"),
	arguments: [
		"js/object/"
	]
});
