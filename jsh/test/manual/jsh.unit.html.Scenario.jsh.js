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

jsh.loader.plugins(jsh.script.file.getRelativePath("../../../loader/api"));
jsh.loader.plugins(jsh.script.file.getRelativePath("../../../jsh/unit"));
var scenario = new jsh.unit.html.Scenario({
	pages: [
		jsh.script.file.getRelativePath("../../../loader/api/unit.api.html").file
	]
});
scenario.run(new jsh.unit.console.Stream({ writer: jsh.shell.stdio.output }));