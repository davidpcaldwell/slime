//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME loader for web browsers.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var apis = [
	"loader/browser/",
	"loader/browser/client.js",
	
	"loader/api/unit.js",
	"loader/api/",
	"loader/api/test/data/1/",
	
	"loader/$api.js",
	"js/object/",
	"js/object/Error.js",
	"js/document/",
	"js/web/",
	"js/time/",
	"js/promise/"
];

var SRC = jsh.script.file.parent.parent.parent.parent;
var pathnames = apis.map(function(path) {
	return SRC.getRelativePath(path);
});
jsh.shell.jsh({
	fork: true,
	script: SRC.getFile("jsh/unit/browser.jsh.js"),
	arguments: jsh.script.arguments.concat(pathnames.map(function(pathname) { return pathname.toString() })),
	evaluate: function(result) {
		jsh.shell.exit(result.status);
	}
});
