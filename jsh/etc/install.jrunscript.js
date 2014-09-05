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

if (!this.$engine) {
	Packages.java.lang.System.err.println("This script must be launched from jrunscript.js.");
	Packages.java.lang.System.exit(1);
}

$engine.run = $engine.resolve(new function() {
	var jdk = new Packages.java.io.File(Packages.java.lang.System.getProperty("java.home"));

	var configureRhino = function(defaultValue) {
		var _property = Packages.java.lang.System.getProperty("jsh.build.rhino");
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
			set($api.rhino.download());
		} else {
			set(new File(property));
		}
		return Packages.java.lang.System.getProperties().get("jsh.build.rhino.jar");
	};

	this.nashorn = function(p) {
		Packages.java.lang.System.getProperties().put("jsh.unbuilt.arguments", p.arguments);
		Packages.java.lang.System.getProperties().put("jsh.unbuilt.src", $source);
		Packages.java.lang.System.getProperties().put("jsh.build.notest", "true");
		configureRhino("false");
		load(p.script);
	};

	this.jdkrhino = function(p) {
		//	TODO	For some reason, running in process does not quite work yet, so we make it configurable and disabled by
		//			default. jsh/launcher/rhino/api.rhino.js does not initialize correctly under the JDK Rhino implementation for
		//			unknown reasons; it runs the Nashorn-specific code, which fails.
		var IN_PROCESS = Packages.java.lang.System.getProperty("jsh.build.test.jrunscript");
		if (IN_PROCESS) {
			Packages.java.lang.System.getProperties().put("jsh.unbuilt.arguments", p.arguments);
			Packages.java.lang.System.getProperties().put("jsh.unbuilt.src", $source);
			Packages.java.lang.System.getProperties().put("jsh.build.notest", "true");
			configureRhino("true");
			load(String(p.script.getCanonicalPath()));
		} else {
			//	TODO	In theory if we carefully constructed a ClassLoader we would not have to shell another process,
			//			maybe?
			$api.shell.rhino({
				rhino: configureRhino("true"),
				properties: {
					"jsh.build.notest": "true"
				},
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
				$api.io.copy(zstream,new FileOutputStream(new Packages.java.io.File(tmpdir, name)));
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
