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

//	Test cases:
//	Open default user, specifying profile, from scratch
//	Open default user, specifying a different profile
//	Open default user, specifying a different profile
jsh.script.Application.run(new function() {
	this.commands = {
		profile: {
			getopts: {
				options: {
					name: String,
					uri: jsh.shell.getopts.ARRAY(String)
				}
			},
			run: function(parameters) {
				//	Results:
				//	OS X, Chrome not open, last used different profile
				//	Works
				//
				//	OS X, Chrome different profile open
				//	Works: Opens window with appropriate profile and adds tabs
				//
				//	OS X, Chrome same profile open
				//	Works: Adds tabs to existing window
				//
				//	TODO	test on Linux
				jsh.shell.echo("Starting ...");
				var chrome = jsh.shell.browser.chrome;
				if (!chrome) throw new Error("Could not locate Chrome browser.");
				chrome.user.profiles.forEach(function(item) {
					jsh.shell.echo("Found profile: " + item.name);
				});
				var profile = chrome.user.profiles.filter(function(profile) {
					return profile.name == parameters.options.name;
				})[0];
				if (parameters.options.uri.length == 0) {
					parameters.options.uri.push("http://www.google.com/");
				}
				jsh.shell.echo("Found profile: " + profile.id + "; opening: " + parameters.options.uri);
				profile.open({ uris: parameters.options.uri });
				jsh.shell.echo("Opened.");
			}
		},
		app: {
			getopts: {
				options: {
					name: String,
					url: String,
					width: Number,
					height: Number,
					x: Number,
					y: Number
				}
			},
			run: function(parameters) {
				var chrome = jsh.shell.browser.chrome;
				var profile = chrome.user.profiles.filter(function(profile) {
					return profile.name == parameters.options.name;
				})[0];
				profile.open({
					app: parameters.options.url,
					position: { x: parameters.options.x, y: parameters.options.y },
					size: { width: parameters.options.width, height: parameters.options.height }
				});
				jsh.shell.console("open() returned.");
			}
		},
		close: {
			getopts: {
				options: {
					exitOnCLose: false
				}
			},
			run: function(parameters) {
				jsh.shell.console("Testing Chrome closure detection ...");
				var chrome = jsh.shell.browser.chrome;
				var user = new chrome.Instance({});
				user.run({
					uri: "about:blank",
					exitOnClose: parameters.options.exitOnClose
				});
				jsh.shell.console("Chrome closure detected.");
			}
		}
	}
});