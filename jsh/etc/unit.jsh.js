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
		built: false,
		view: "console",
		port: Number,
		"chrome:profile": jsh.file.Pathname,
		unit: String
	}
});

var environment = new function() {
	this.jsh = new function() {
		var unbuilt;
		var built;

		//	TODO	we would like to memoize this function, but what happens if a memoized function throws an error?
		Object.defineProperty(this, "built", {
			get: function() {
				if (!built) {
					if (jsh.shell.jsh.src) {
						var home = jsh.shell.TMPDIR.createTemporary({ directory: true });
						jsh.shell.jsh({
							shell: jsh.shell.jsh.src,
							script: jsh.script.file.parent.getFile("build.jsh.js"),
							arguments: [
								home,
								"-notest",
								"-nodoc"
							]
						});
						built = home;
					} else {
						throw new Error();
					}
				}
				return built;				
			}
		});
		
		Object.defineProperty(this, "unbuilt", {
			get: function() {
				if (!unbuilt) {
					if (jsh.shell.jsh.src) {
						unbuilt = jsh.shell.jsh.src;
					} else {
						throw new Error();
					}
				}
				return unbuilt;
			}
		});
	}
}

if (parameters.options.built) {
	var home = jsh.shell.TMPDIR.createTemporary({ directory: true });
	jsh.shell.jsh({
		shell: jsh.shell.jsh.src,
		script: jsh.script.file.parent.getFile("build.jsh.js"),
		arguments: [
			home,
			"-notest",
			"-nodoc"
		]
	});
	jsh.shell.jsh({
		shell: home,
		script: jsh.script.file,
		arguments: (function(rv) {
			rv.push("-view",parameters.options.view);
			if (parameters.options.port) rv.push("-port",parameters.options.port);
			if (parameters.options["-chrome:profile"]) rv.push("-chrome:profile",parameters.options["chrome:profile"]);
			if (parameters.options.unit) rv.push("-unit",parameters.options.unit);
			return rv;
		})([]),
		evaluate: function(result) {
			jsh.shell.exit(result.status);
		}
	})
}

var definition = new jsh.unit.part.Html({
	name: "jsh Unit Tests",
	pathname: jsh.script.file.parent.getRelativePath("api.html"),
	environment: environment
});

var find = function(definition,name,path) {
	if (!path) path = [];
	if (definition.name == name) return path;
	for (var x in definition.parts) {
		var found = find(definition.parts[x],name,path.concat([x]));
		if (found) return found;
	}
	return null;
}

var suite = new jsh.unit.Suite(definition);

jsh.unit.interface.create(suite, new function() {
	if (parameters.options.view == "chrome") {
		this.chrome = {
			profile: parameters.options["chrome:profile"],
			port: parameters.options.port
		};
	} else {
		this.view = parameters.options.view;
	}
	if (parameters.options.unit) {
		this.path = find(definition,parameters.options.unit);
	}
});
