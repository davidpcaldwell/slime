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
	"loader/browser/", // zero tests
	"loader/browser/client.js", // migrated

	"loader/api/unit.js", // migrated
	"loader/api/", // migrated
	"loader/api/test/data/1/", // migrated

	"loader/browser/test/", // migrated, unsuccessfully

	"loader/$api.js", // migrated
	"js/object/", // migrated
	"js/object/Error.js", // migrated
	"js/document/", // migrated
	"js/web/", // migrated
	"js/time/", // migrated

	"js/promise/" // migrated
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
