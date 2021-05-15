//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

var slime;
if (!slime) slime = {};
slime.build = {};

//	Build using Rhino shell; used by jsh build
// TODO: is this still used? May have been replaced by build script which runs in unbuilt shell
slime.build.rhino = function(from,build,api,javac) {
	//	copy everything except 'java' directory
	api.copyFile(from,build,[
		{
			accept: function(f) {
				return f.isDirectory() && f.getName() == "java" && f.getCanonicalPath() != from.getCanonicalPath();
			},
			process: function(f,t) {
			}
		},
		{
			accept: function(f) {
				return f.isDirectory() && f.getName() == ".hg";
			},
			process: function(f,t) {
			}
		}
	]);

	var javaDirectory = new Packages.java.io.File(from,"java");
	var rhinoDirectory = new Packages.java.io.File(from,"rhino/java");

	if (javaDirectory.exists() || (javac.rhino && rhinoDirectory.exists())) {
		var list = [];

		var process = function(f) {
			if (f.isDirectory()) {
				var files = f.listFiles();
				for (var i=0; i<files.length; i++) {
					process(files[i]);
				}
			} else {
				if (f.getName().endsWith(".java")) {
					list.push(f);
				}
			}
		}

		if (javaDirectory.exists()) {
			process(javaDirectory);
		}
		if (javac.rhino && rhinoDirectory.exists()) {
			process(rhinoDirectory);
		}

		//	TODO	Not DRY: $jvm/classes repeated in loader/jrunscript/expression.js
		var to = new Packages.java.io.File(build,"$jvm/classes");
		to.mkdirs();
		var args = ["-d", String(to.getCanonicalPath())];
		if (javac && javac.classpath) {
			args = args.concat(["-classpath", javac.classpath]);
		}
		if (javac && javac.nowarn) {
			args = args.concat(["-nowarn"]);
		}
		if (javac && javac.source) {
			args = args.concat(["-source",javac.source]);
		}
		if (javac && javac.target) {
			args = args.concat(["-target",javac.target]);
		}
		args = args.concat(list.map(function(file) {
			return String(file.getCanonicalPath());
		}));
		api.compile(args);
	}
}

//	Build using jsh shell; used by slime.jsh.js
slime.build.jsh = function(from,build,javac) {
	var toCopy = from.list({
		filter: function(node) {
			return !node.directory;
		},
		descendants: function(node) {
			if (node.directory && node.pathname.basename == "java") return false;
			return true;
		},
		type: from.list.ENTRY
	});
	toCopy.forEach(function(item) {
		item.node.copy(build.getRelativePath(item.path), { recursive: true });
	});

	if (javac) {
		var destination;
		["java", "rhino/java"].forEach(function(path) {
			if (path == "rhino/java" && !javac.rhino) return;
			var directory = from.getSubdirectory(path);
			if (directory) {
				if (!destination) destination = build.getRelativePath("$jvm/classes").createDirectory({ recursive: true });
				var toCompile = directory.list({
					filter: function(node) { return true; },
					descendants: function(dir) { return true; },
					type: from.list.ENTRY
				}).filter( function(item) {
					if (!/\.java$/.test(item.path)) return false;
					return true;
				} ).map( function(item) {
					var rv = item.node.pathname;
					if (jsh.file.filesystems.cygwin) {
						rv = jsh.file.filesystems.cygwin.toWindows(rv);
					}
					return rv;
				} );

				//	TODO	below can probably be replaced by rhino/tools APIs
				//	TODO	it would be nice to remove the below explicit Cygwin reference
				var d = destination.pathname;
				if (jsh.file.filesystems.cygwin) {
					d = jsh.file.filesystems.cygwin.toWindows(d);
				}
				jsh.shell.echo("Compiling from " + directory + " to " + d.toString());
				var args = [ "-d", d.toString() ];
				//	TODO	repeated above
				if (javac && javac.classpath) {
					args = args.concat(["-classpath", javac.classpath]);
				}
				if (javac && javac.nowarn) {
					args = args.concat(["-nowarn"]);
				}
				if (javac && javac.source) {
					args = args.concat(["-source",javac.source]);
				}
				if (javac && javac.target) {
					args = args.concat(["-target",javac.target]);
				}
				var args = args.concat( toCompile.map( function(item) { return item.toString() } ) );
				Packages.javax.tools.ToolProvider.getSystemJavaCompiler().run(
					Packages.java.lang.System["in"],
					Packages.java.lang.System.out,
					Packages.java.lang.System.err,
					jsh.java.Array.create({ type: Packages.java.lang.String, array: args.map(function(s) { return new Packages.java.lang.String(s); }) })
				);
			}
		});
	}
}
//	Need to export the slime symbol when loading from slime.jsh.js, but there will be no "$exports" variable when loading from the
//	rhino shell during the build process
try {
	$exports.slime = slime;
} catch (e) {
}