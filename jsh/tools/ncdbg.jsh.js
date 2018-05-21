//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2018 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		"ncdbg:chrome:instance": jsh.file.Pathname,
		"ncdbg:port:jvm": 7777,
		"ncdbg:port:ncdbg": 7778,
		"ncdbg:pause": 2000
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

var lock = new jsh.java.Thread.Monitor();
var scriptExited = false;
var browser;

var getDevtoolsUrl = function() {
	return "chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=localhost:" + parameters.options["ncdbg:port:ncdbg"] + "/dbg";
};

var copyUrlToClipboard = function(string) {
	var url = getDevtoolsUrl();
	if (jsh.shell.PATH.getCommand("pbcopy")) {
		jsh.shell.run({
			command: "pbcopy",
			stdio: {
				input: url
			}
		});
		jsh.shell.console("Copied " + url + " to clipboard.");
	} else {
		jsh.shell.console("URL to paste into Chrome:");
		jsh.shell.console(url);
	}	
}

var startChrome = function() {
	var chrome = new jsh.shell.browser.chrome.Instance({
		location: parameters.options["ncdbg:chrome:instance"]
	});

	chrome.run({
		uri: getDevtoolsUrl(),
		on: {
			start: function(process) {
				browser = process;
			}
		}
	});
};

var startScript = function() {
	copyUrlToClipboard();

	//	TODO	ideally would detect emission of startup message
	var properties = {
		"jsh.debug.jdwp": "transport=dt_socket,address=" + parameters.options["ncdbg:port:jvm"] + ",server=y,suspend=y",
		"jsh.engine": "nashorn"
	};

	try {
		jsh.shell.jrunscript({
			properties: properties,
			arguments: [
				jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),
				"jsh"
			].concat(parameters.arguments)
		});
	} catch (e) {
		jsh.shell.console("script failed.");
	} finally {
		jsh.shell.console("script exited");
	}
	jsh.shell.console("Notifying ...");
	lock.Waiter({
		until: function() {
			return true;
		},
		then: function() {
			scriptExited = true;
		}
	})();
	jsh.shell.console("Notified listener.");
};

var startNcdbg = function() {
	try {
		Packages.java.lang.Thread.currentThread().sleep(parameters.options["ncdbg:pause"]);
		var JAVA_HOME = jsh.shell.java.home.parent;
		jsh.shell.run({
			command: jsh.shell.jsh.lib.getRelativePath("ncdbg/bin/ncdbg"),
			directory: jsh.shell.jsh.lib.getSubdirectory("ncdbg"),
			environment: jsh.js.Object.set({}, jsh.shell.environment, {
				JAVA_HOME: JAVA_HOME.toString()
			})
		});
		jsh.shell.console("ncdbg exited");
	} catch (e) {
		jsh.shell.console(e);
		jsh.shell.console(e.stack);
	}
}

if (parameters.options["ncdbg:chrome:instance"]) {
	jsh.java.Thread.start(startChrome);
}

if (parameters.arguments.length) {
	jsh.java.Thread.start(startScript);
	
	jsh.java.Thread.start(startNcdbg);
	
	lock.Waiter({
		until: function() {
			return scriptExited;
		},
		then: function() {
			jsh.shell.console("Finished; trying to terminate browser.");
			if (browser) {
				try {
					browser.kill();
				} catch (e) {
					jsh.shell.console("Error killing browser: browser");
				}
			} else {
				jsh.shell.console("No browser in process.");
			}
		}
	})();
}

