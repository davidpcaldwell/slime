//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$engine.run = $engine.resolve(new function() {
	var jdk = new Packages.java.io.File(Packages.java.lang.System.getProperty("java.home"));

	var copy = function(from,to) {
		var b;
		while( (b = from.read()) != -1 ) {
			to.write(b);
		}
		to.close();
	};

	var downloadMozillaRhinoDistribution = function(url) {
		var _url = new Packages.java.net.URL(url);
		println("Downloading Rhino from " + _url);
		var _connection = _url.openConnection();
		var _zipstream = new Packages.java.util.zip.ZipInputStream(_connection.getInputStream());
		var _entry;
		var tmpdir = Packages.java.io.File.createTempFile("jsh-install",null);
		tmpdir["delete"]();
		tmpdir.mkdirs();
		if (!tmpdir.exists()) {
			throw new Error("Failed to create temporary file.");
		}
		var tmprhino = new Packages.java.io.File(tmpdir,"js.jar");
		while(_entry = _zipstream.getNextEntry()) {
			var name = String(_entry.getName());
			var path = name.split("/");
			if (path[1] == "js.jar") {
				var out = new Packages.java.io.FileOutputStream(tmprhino);
				copy(_zipstream,out);
			}
		}
		println("Downloaded Rhino to " + tmprhino);
		return tmprhino;
	};

	var configureRhino = function(defaultValue) {
		var _property = Packages.java.lang.System.getProperty("jsh.build.rhino.jar");
		var property = (_property) ? String(_property) : defaultValue;
		var set = function(value) {
			if (!value) {
				Packages.java.lang.System.getProperties().remove("jsh.build.rhino.jar");
			} else {
				Packages.java.lang.System.getProperties().put("jsh.build.rhino.jar",value);
			}
		}
		if (property == "false") {
			set(null);
		} else if (property == "true") {
			set(downloadMozillaRhinoDistribution("http://ftp.mozilla.org/pub/mozilla.org/js/rhino1_7R3.zip"));
		} else {
			set(new File(property));
		}
		return Packages.java.lang.System.getProperties().get("jsh.build.rhino.jar");
	};

	this.nashorn = function(p) {
		Packages.java.lang.System.getProperties().put("jsh.build.arguments", p.arguments);
		Packages.java.lang.System.getProperties().put("jsh.build.src", $source);
		Packages.java.lang.System.getProperties().put("jsh.build.notest", "true");
		configureRhino("true");
		load(p.script);
	};

	this.jdkrhino = function(p) {
		var IN_PROCESS = false;
		if (IN_PROCESS) {
			Packages.java.lang.System.getProperties().put("jsh.build.arguments", p.arguments);
			Packages.java.lang.System.getProperties().put("jsh.build.src", $source);
			Packages.java.lang.System.getProperties().put("jsh.build.notest", "true");
			configureRhino("true");
			var USE_EVAL = false;
			if (USE_EVAL) {
				var readFile = function(file) {
					var _r = new Packages.java.io.FileReader(file);
					var _c;
					var _b = new Packages.java.io.StringWriter();
					while( (_c = _r.read()) != -1 ) {
						_b.write(_c);
					}
					return _b.toString();
				};

				//	TODO	this does not seem to work; eval is essentially a no-op, for unknown reason
				var code = readFile(p.script.getCanonicalPath());
				eval(code);
			} else {
				load(file);
			}
		} else {
			//	TODO	In theory if we carefully constructed a ClassLoader we would not have to shell another process,
			//			maybe?
			$api.shell.rhino({
				rhino: configureRhino("true"),
				script: p.script,
				arguments: p.arguments,
				directory: p.directory
			});
		}
	}
});

var $source = (function() {
	if ($script.file) {
		return new File($script.file, "../../..").getCanonicalFile();
	} else {
		var copy = function(from,to) {
			var b;
			while( (b = from.read()) != -1 ) {
				to.write(b);
			}
			to.close();
		}

		//	sample link		https://bitbucket.org/davidpcaldwell/slime/get/[label].zip
		//	sample script	https://bitbucket.org/davidpcaldwell/slime/raw/[label]/jsh/etc/install.jrunscript.js
		//	TODO	implement determination of URL from Bitbucket
		var bitbucketParser = /^http(?:s?)\:\/\/bitbucket.org\/davidpcaldwell\/slime\/raw\/(.*)\/jsh\/etc\/install.jrunscript.js$/;
		var version;
		var match = bitbucketParser.exec($script.url.toExternalForm());
		if (match) {
			version = match[1];
		}
		var tmpdir = Packages.java.io.File.createTempFile("slime",null);
		tmpdir["delete"]();
		tmpdir.mkdirs();
		var downloadUrl = "https://bitbucket.org/davidpcaldwell/slime/get/" + version + ".zip";
		var stream = new Packages.java.net.URL(downloadUrl).openConnection().getInputStream();
		var zstream = new Packages.java.util.zip.ZipInputStream(stream);
		var entry;
		println("Downloading source to " + tmpdir);
		var topname;
		while(entry = zstream.getNextEntry()) {
			var name = String(entry.getName());
			var toFile = new Packages.java.io.File(tmpdir,name);
			toFile.getParentFile().mkdirs();
			if (!topname) topname = name.split("/")[0];
			println(name);
			if (name.substring(name.length-1) == "/") {
				new Packages.java.io.File(tmpdir, name).mkdirs();
			} else {
				copy(zstream,new FileOutputStream(new Packages.java.io.File(tmpdir, name)));
			}
		}
		return new File(tmpdir,topname);
	}
})();

$engine.run({
	script: new Packages.java.io.File($source, "jsh/etc/unbuilt.rhino.js"),
	arguments: ["build"].concat($arguments),
	directory: $source
});
