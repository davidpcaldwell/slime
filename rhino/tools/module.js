//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	We do not want to pre-load the Java compiler as it is way too slow to do so.
//	TODO	verify that this setup does not load it
$exports.__defineGetter__("javac", $api.experimental($context.api.js.constant(function() {
	var javac = (function() {
		if (Packages.javax.tools.ToolProvider.getSystemJavaCompiler()) {
			return new function() {
				this.command = function javac(args) {
					return Packages.javax.tools.ToolProvider.getSystemJavaCompiler().run(
						null, null, null,
						$context.api.java.Array.create({
							type: Packages.java.lang.String,
							array: args.map(function(s) { return new Packages.java.lang.String(s); })
						})
					)
				}
			};
		} else {
			var toolpath = jsh.file.Searchpath([ jsh.shell.java.home.getRelativePath("bin") ]);
			if (toolpath.getCommand("javac")) {
				return new function() {
					this.command = function(args) {
						return jsh.shell.run({
							command: toolpath.getCommand("javac"),
							arguments: args,
							evaluate: function(result) {
								return result.status;
							}
						});
					}
				}
			}
		}
	})();
	if (!javac) return function(){}();
	return function(p) {
		var args = [];
		//	TODO	add documentation and test
		if (p.debug === true) {
			args.push("-g");
		}
		//	TODO	accept destination that is directory object, not just Pathname
		if (p.destination) {
			//	TODO	figure out what to do with recursive
			p.destination.createDirectory({
				ifExists: function(dir) {
					return false;
				},
				recursive: false
			});
			args.push("-d", p.destination);
		}
		if (p.classpath && p.classpath.pathnames.length) {
			args.push("-classpath", p.classpath);
		}
		if (p.sourcepath && p.sourcepath.pathnames.length) {
			args.push("-sourcepath", p.sourcepath);
		}
		if (p.source) {
			args.push("-source", p.source);
		}
		if (p.target) {
			args.push("-target", p.target);
		}
		if (p.arguments) {
			args = args.concat(p.arguments.map(function(file) {
				return file.toString();
			}));
		}
		var status = javac.command(args);
		var evaluate = (p.evaluate) ? p.evaluate : function(result) {
			if (status) {
				if (p && p.on && p.on.exit) {
					p.on.exit({
						status: status,
						arguments: args
					})
				}
				throw new Error("Exit status: " + status);
			} else {
				return {
					status: status,
					arguments: args
				};
			}
		};
		return evaluate({
			status: status,
			arguments: args
		});
	};
})));

$exports.Jar = function(o) {
	var _peer = (function(o) {
		if (o.file) {
			return new Packages.java.util.jar.JarFile(
				o.file.pathname.java.adapt()
			);
		}
	})(o);

	this.manifest = (function() {
		var _manifest = _peer.getManifest();
		var _main = _manifest.getMainAttributes();
		var _entries = _main.entrySet().iterator();
		var rv = {
			main: {}
		};
		while(_entries.hasNext()) {
			var _entry = _entries.next();
			rv.main[String(_entry.getKey())] = String(_entry.getValue());
		}
		return rv;
	})();
};

$exports.askpass = $loader.file("askpass.js", {
	api: {
		java: $context.api.java
	}
});
