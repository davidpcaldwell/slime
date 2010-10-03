//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the jsh JavaScript/Java shell.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

var slime = {
	build: {}
};

//	Build using Rhino shell; used by jsh build
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

	if (javaDirectory.exists()) {
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

		process(javaDirectory);

		var to = new Packages.java.io.File(build,"$jvm/classes");
		to.mkdirs();
		var args = ["-d", String(to.getCanonicalPath())];
		if (javac && javac.classpath) {
			args = args.concat(["-classpath", javac.classpath]);
		}
		if (javac && javac.nowarn) {
			args = args.concat(["-nowarn"]);
		}
		args = args.concat(list.map(function(file) {
			return String(file.getCanonicalPath());
		}));
		api.compile(args);
	}
}

//	Build using jsh shell; used by slime.jsh
slime.build.jsh = function(from,build) {
	var toCopy = from.list({ recursive: true }).map(function(node) {
		return {
			path: node.pathname.toString().substring(from.pathname.toString().length+1),
			node: node
		}
	}).filter(function(entry) {
		//	TODO	This explicitly depends on UNIX-style paths; should use file separator but OK for now because jsh depends on bash
		return !entry.node.directory && entry.path.substring(0,"java/".length) != "java/";
	});

	toCopy.forEach( function(item) {
		var topath = build.getRelativePath(item.path);
		if (item.directory) {
			topath.createDirectory();
		} else {
			topath.write(item.node.read(jsh.file.Streams.binary), { recursive: true });
		}
	} );

	if (from.getSubdirectory("java")) {
		var toCompile = from.getSubdirectory("java").list({ recursive: true }).filter( function(node) {
			if (node.directory) return false;
			if (!/\.java$/.test(node.pathname.toString())) return false;
			return true;
		} ).map( function(node) {
			var rv = node.pathname;
			if (jsh.file.filesystems.cygwin) {
				rv = jsh.file.filesystems.cygwin.toWindows(rv);
			}
			return rv;
		} );

		var destination = build.getRelativePath("$jvm/classes").createDirectory({ recursive: true });
		var args = [ "-d", destination.pathname.toString() ];
		var args = args.concat( toCompile.map( function(item) { return item.toString() } ) );
		Packages.javax.tools.ToolProvider.getSystemJavaCompiler().run(
			Packages.java.lang.System["in"],
			Packages.java.lang.System.out,
			Packages.java.lang.System.err,
			jsh.java.toJavaArray( args, Packages.java.lang.String, function(x) { return new java.lang.String(x) } )
		);
	}
}
//	Need to export the slime symbol when loading from slime.jsh, but there will be no "$exports" variable when loading from the
//	rhino shell during the build process
try {
	$exports.slime = slime;
} catch (e) {
}