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

var debug = function(message) {
	if (arguments.callee.on) Packages.java.lang.System.err.println(message);
}

var console = function(message) {
	Packages.java.lang.System.err.println(message);
}

var exit = function(code) {
	Packages.java.lang.System.exit(code);
}

var slash = String(Packages.java.io.File.separator);
var colon = String(Packages.java.io.File.pathSeparator);

var env = (function() {
	var caseInsensitive = (Packages.java.lang.System.getenv("path") == Packages.java.lang.System.getenv("PATH"));
	var rv = {};

	//	This formulation requires JDK 1.5+; would need different mechanism for JDK 1.4 and lower
	var map = Packages.java.lang.System.getenv();
	var entries = map.entrySet().iterator();
	while(entries.hasNext()) {
		var entry = entries.next();
		var name = String(entry.getKey());
		if (caseInsensitive) name = name.toUpperCase();
		rv[name] = String(entry.getValue());
	}
	return rv;
})();

var JAVA_HOME = new Packages.java.io.File(Packages.java.lang.System.getProperty("java.home"));

var platform = new function() {
	var uname = function() {
		try {
			var mode = { output: "" };
			var status = runCommand("uname", mode);
			if (!status) {
				return mode.output.substring(0,mode.output.length-1);
			}
		} catch (e) {
			return function(){}();
		}
	}();
	debug("uname = [" + uname + "]");

	if (uname) {
		this.unix = {
			uname: uname
		}

		if (uname.substring(0,6) == "CYGWIN") {
			//	TODO	Hardcoded file locations, among other problems
			//	reg query "HKLM\Software\Cygnus Solutions\Cygwin\mounts v2\/"
			this.cygwin = new function() {
				this.realpath = function(unix) {
					option = { output: "" };
					runCommand("c:/cygwin/bin/realpath.exe",unix,option);
					return option.output.substring(0,option.output.length-1);
				}

				this.cygpath = new function() {
					this.windows = function(unix,mode) {
						if (!mode) mode = {};
						var m = (mode.path) ? "-wp" : "-w";
						var option = {output: ""};
						var exit = runCommand("c:/cygwin/bin/cygpath.exe", m, unix, option);
						return option.output.substring(0,option.output.length-1);
					}

					this.unix = function(windows,mode) {
						if (!mode) mode = {};
						var m = (mode.path) ? "-up" : "-u";
						var option = {output: ""};
						var exit = runCommand("c:/cygwin/bin/cygpath.exe", m, windows, option);
						return option.output.substring(0,option.output.length-1);
					}
				}
			}
		}
	}
};
platform.io = {};
platform.io.write = function(to,writerFunction) {
	var writer = new Packages.java.io.PrintWriter(new Packages.java.io.FileWriter(to));
	writerFunction(writer);
	writer.close();
}
platform.io.copyStream = function(i,o) {
	var r;
	while( (r = i.read()) != -1 ) {
		o.write(r);
	}
}
platform.jdk = {};
if (Packages.javax.tools.ToolProvider.getSystemJavaCompiler()) {
	platform.jdk.compile = function(args) {
		var jarray = Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.String,args.length);
		for (var i=0; i<jarray.length; i++) {
			jarray[i] = new Packages.java.lang.String(args[i]);
		}
		//	TODO	The below method getSystemJavaCompiler returns null if this is a JRE
		var compiler = Packages.javax.tools.ToolProvider.getSystemJavaCompiler();
		if (compiler == null) {
			throw { jdk: true };
		}
		var status = compiler.run(
			Packages.java.lang.System["in"],
			Packages.java.lang.System.out,
			Packages.java.lang.System.err,
			jarray
		);
		if (status) {
			throw "Compiler exited with status " + status + " with inputs " + args.join(",");
		}
	}
}

var copyFile = function(from,to,filters) {
	if (!filters) filters = [];
	for (var i=0; i<filters.length; i++) {
		if (filters[i].accept(from)) {
			filters[i].process(from,to);
			return;
		}
	}
	if (from.isDirectory()) {
		to.mkdir();
		var files = from.listFiles();
		for (var i=0; i<files.length; i++) {
			copyFile(files[i], new File(to,files[i].getName()), filters);
		}
	} else if (from.exists()) {
		var i = new Packages.java.io.BufferedInputStream(Packages.java.io.FileInputStream(from));
		var o = new Packages.java.io.BufferedOutputStream(Packages.java.io.FileOutputStream(to));
		platform.io.copyStream(i,o);
		o.close();
		i.close();
	} else {
		throw "Unimplemented: copying " + from.getCanonicalPath();
	}
}

var createTemporaryDirectory = function() {
	var tmpfile;
	for (var i=0; i<20; i++) {
		try {
			tmpfile = Packages.java.io.File.createTempFile("jsh",null);
		} catch (e) {
			Packages.java.lang.System.err.println("Warning: " + String(i+1) + " failures creating temp file in " + Packages.java.lang.System.getProperty("java.io.tmpdir"));
		}
	}
	if (tmpfile) {
		tmpfile["delete"]();
		tmpfile.mkdirs();
		return tmpfile;
	} else {
		throw "Could not create temporary file.";
	}
}

var zip = function(from,to,filters) {
	if (!filters) filters = [];
	var zstream = new Packages.java.util.zip.ZipOutputStream(new Packages.java.io.FileOutputStream(to));

	var directories = {};

	var createDirectory = function(path) {
		if (path.length == 0) return;
		var tokens = path.split("/");
		for (var i=1; i<tokens.length; i++) {
			var partial = tokens.slice(0,i).join("/");
			if (!directories[partial]) {
				var entry = new Packages.java.util.zip.ZipEntry(partial+"/");
				zstream.putNextEntry(entry);
				zstream.closeEntry();
				directories[partial] = true;
			}
		}
	}

	var process = function(file,prefix,filters) {
		for (var i=0; i<filters.length; i++) {
			if (filters[i].accept(file)) {
				filters[i].process(file,prefix);
				return;
			}
		}

		var nextPrefix = function() {
			if (prefix == "") return "";
			return prefix + "/";
		}

		if (file.isDirectory()) {
			createDirectory(prefix);
			var files = file.listFiles();
			for (var i=0; i<files.length; i++) {
				process(files[i],nextPrefix()+file.getName(),filters);
			}
		} else {
			createDirectory(prefix);
			var entry = new Packages.java.util.zip.ZipEntry(nextPrefix()+file.getName());
			zstream.putNextEntry(entry);
			var i = new Packages.java.io.FileInputStream(file);
			platform.io.copyStream(i,zstream);
			i.close();
			zstream.closeEntry();
		}
	}

	var top = from.listFiles();
	for (var i=0; i<top.length; i++) {
		process(top[i],"",filters);
	}
	zstream.close();
}