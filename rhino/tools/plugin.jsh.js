//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return typeof(jsh.java) != "undefined" && Packages.javax.tools.ToolProvider.getSystemToolClassLoader() != null;
	},
	load: function() {
		jsh.java.tools = new function() {
			//	We do not want to pre-load the Java compiler as it is way too slow to do so.
			this.__defineGetter__("javac", function() {
				var javac = Packages.javax.tools.ToolProvider.getSystemJavaCompiler();
				if (!javac) return function(){}();
				return function(p) {
					var args = [];
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
					if (p.arguments) {
						args = args.concat(p.arguments);
					}
					var status = javac.run(
						null, null, null, jsh.java.toJavaArray(args,Packages.java.lang.String,function(s) {
							return new Packages.java.lang.String(s)
						})
					);
					if (status) {
						if (p && p.on && p.on.exit) {
							p.on.exit({
								status: status,
								arguments: args
							})
						}
						throw new Error();
					}
				};
			});
		}
	}
})