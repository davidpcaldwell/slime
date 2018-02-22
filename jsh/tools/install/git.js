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

$exports.install = $context.api.Events.Function(function(p,events) {
	var console = function(message) {
		events.fire("console", message);
	};
	if (!$context.module.installation) {
		if ($context.api.shell.os.name == "Mac OS X") {
			console("Detected OS X " + $context.api.shell.os.version);
			console("Install Apple's command line developer tools.");
			$context.api.shell.run({
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
