//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the rhino/shell SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	alternate version: could open the program with no arguments and then use the application launch version to activate
//			correctly. This can open an extra window, which would be noise
jsh.script.Application.run(new function() {
	this.commands = {
		profile: {
			getopts: {
				name: String
			},
			run: function(parameters) {
				jsh.shell.echo("Starting ...");
				var chrome = jsh.shell.browser.chrome;
				if (!chrome) throw new Error("Could not locate Chrome browser.");
				chrome.user.profiles.forEach(function(item) {
					jsh.shell.echo("Found profile: " + item.name);
				});
				var profile = chrome.user.profiles.filter(function(profile) {
					return profile.name == parameters.options.name;
				})[0];
				jsh.shell.echo("Found profile: " + profile);
				jsh.java.Thread.start({
					call: function() {
						profile.open({ uri: "http://www.google.com/" });
					}
				});
				jsh.shell.echo("Opened.");
			}
		}
	}
});