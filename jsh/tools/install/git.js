//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2017 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var GUI = $context.api.Error.Type("Please execute the graphical installer.");

//	TODO	with the ability to mock the entire shell in a plugin, is this still needed?
var resolveMocks = function(p) {
	var rv = {
		shell: (p && p.mock && p.mock.shell) ? p.mock.shell : $context.api.shell,
		file: (p && p.mock && p.mock.file) ? p.mock.file : $context.api.file
	};
	rv.exists = function(pathname) {
		return Boolean(this.file.Pathname(pathname).directory);
	};
	return rv;
};

var find = function(api) {
	if (!api) api = resolveMocks();
	var rv = api.shell.PATH.getCommand("git");
	if (api.shell.os.name == "Mac OS X" && !api.exists("/Applications/Xcode.app") && !api.exists("/Library/Developer/CommandLineTools")) {
		rv = null;
	}
	return rv;
};

$exports.install = $context.api.Events.Function(function(p,events) {
	var api = resolveMocks(p);
	var console = function(message) {
		events.fire("console", message);
	};
	if (!find(api)) {
		if (api.shell.os.name == "Mac OS X") {
			console("Detected OS X " + api.shell.os.version);
			console("Install Apple's command line developer tools.");
			api.shell.run({
				command: "/usr/bin/git",
				evaluate: function(result) {
					//	Do nothing; exit status will be 1
					throw new GUI();
				}
			});
		} else {
			throw new Error("Unimplemented: installation of Git for non-OS X system.");
		}
	} else {
		console("Git already installed.");
	}
});
$exports.install.GUI = GUI;

$exports.credentialHelper = {};

var program = find();

if (program) {
	$exports.installation = new $context.api.Installation({
		program: program
	});
}
