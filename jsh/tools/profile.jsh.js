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

var parameters = jsh.script.getopts({
	options: {
		"profiler:javassist": jsh.file.Pathname,
		"profiler:output": jsh.file.Pathname,
		"profiler:exclude": jsh.script.getopts.ARRAY(String),
		"profiler:built": false,
		"profiler:nobrowser": false
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

if (!parameters.options["profiler:output"]) {
	parameters.options["profiler:output"] = jsh.shell.TMPDIR.createTemporary({ directory: true }).getRelativePath("profile.html");
}

var src = jsh.script.file.parent.parent.parent;
var profiler;
if (parameters.options["profiler:built"]) {
	var home = jsh.shell.TMPDIR.createTemporary({ directory: true });
	jsh.shell.jsh({
		script: src.getFile("jsh/etc/build.jsh.js"),
		arguments: [
			"-nounit", "-notest",
			"-nodoc",
			home
		]
	});
	jsh.shell.console("Built to " + home);
	profiler = home.getRelativePath("tools/profiler.jar")
} else {
	profiler = jsh.shell.TMPDIR.createTemporary({ prefix: "profiler.", suffix: ".jar" });
}

if (parameters.options["profiler:built"]) {
	jsh.shell.jsh({
		shell: home,
		script: src.getFile("jsh/etc/install/profiler.jsh.js")
	});
} else {
	jsh.shell.jsh({
		fork: true,
		script: jsh.shell.jsh.src.getFile("rhino/tools/profiler/build.jsh.js"),
		arguments: (function() {
			var rv = [];
			if (parameters.options["profiler:javassist"]) {
				rv.push("-javassist", parameters.options["profiler:javassist"]);
			}
			rv.push("-to", profiler);
			return rv;
		})()
	});
}

var configuration = [];
if (parameters.options["profiler:output"]) {
	configuration.push("output=" + parameters.options["profiler:output"]);
}
parameters.options["profiler:exclude"].forEach(function(pattern) {
	configuration.push("exclude=" + pattern);
});
var properties = {
	"jsh.debug.script": (configuration.length) ? "profiler:" + configuration.join(",") : "profiler",
	"jsh.shell.profiler": profiler.toString()
};
if (jsh.shell.rhino) {
	properties["jsh.engine.rhino.classpath"] = String(jsh.shell.rhino.classpath);
}

if (!parameters.options["profiler:built"]) {
	jsh.shell.jrunscript({
		properties: properties,
		arguments: [jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),"jsh"].concat(parameters.arguments)
	});
} else {
	jsh.shell.jrunscript({
		properties: properties,
		arguments: [home.getRelativePath("jsh.js")].concat(parameters.arguments)
	});
}

if (parameters.options["profiler:output"] && jsh.shell.browser.chrome && !parameters.options["profiler:nobrowser"]) {
	jsh.shell.browser.chrome.user.open( { uri: String(parameters.options["profiler:output"].java.adapt().toURL().toExternalForm()) } );
}

