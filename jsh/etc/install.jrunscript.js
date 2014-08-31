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

(function() {
	var $engine = (function(global) {
		var Nashorn = function() {
			this.filename = new Packages.java.lang.Throwable().getStackTrace()[0].getFileName();
		};
		
		var Rhino = function() {
			this.filename = global["javax.script.filename"];
		}
		
		var engines = {
			nashorn: new Nashorn(),
			jdkrhino: new Rhino()
		};
		
		var name = (function() {
			if (new Packages.javax.script.ScriptEngineManager().getEngineByName("nashorn")) {
				return "nashorn";
			} else {
				return "jdkrhino";
			}
		})();
		
		var rv = engines[name];
		rv.resolve = function(options) {
			return options[name];
		};
		return rv;
	})(this);
	
	var $java = new function() {
		var jdk = new Packages.java.io.File(Packages.java.lang.System.getProperty("java.home"));
		var launcher = (function() {
			if (new File(jdk, "bin/java").exists()) return new File(jdk, "bin/java");
			if (new File(jdk, "bin/java.exe").exists()) return new File(jdk, "bin/java.exe");
		})();
		
		this.home = jdk;
		this.launcher = launcher;
	};
	
	var $script = (function() {
		var interpret = function(string) {
			if (new Packages.java.io.File(string).exists()) {
				var file = new Packages.java.io.File(string);
				return {
					file: file,
					load: function(path) {
						load(new Packages.java.io.File(file.getParentFile(), path).getCanonicalPath());
					}
				};
			} else {
				var url = new Packages.java.net.URL(string);
				return {
					url: url,
					load: function(path) {
						load(new Packages.java.net.URL(url, path).toExternalForm());
					}
				};
			}
		};

		return interpret($engine.filename);
	})();

	var $arguments = (function() {
		var rv = [];
		for (var i=0; i<this["javax.script.argv"].length; i++) {
			rv[i] = String(this["javax.script.argv"][i]);
		}
		return rv;
	})();
	
	var $api = {};
	$api.shell = {};	
	$api.shell.rhino = function(p) {
		//	p:
		//		rhino (Packages.java.io.File): Rhino js.jar
		//		script (Packages.java.io.File): main script to run
		//		arguments (Array): arguments to send to script
		//		directory (optional Packages.java.io.File): working directory in which to run it
		var command = [
			$java.launcher.getCanonicalPath(),
			"-Djsh.build.notest=true",
			"-jar",p.rhino.getCanonicalPath(),
			"-opt","-1",
			p.script.getCanonicalPath()].concat( (p.arguments) ? p.arguments : [] );
		var USE_JRUNSCRIPT_EXEC = false;
		if (USE_JRUNSCRIPT_EXEC) {
			//	The jrunscript built-in exec() requires a single argument, which causes a mess here; we don't want to
			//	double-quote "Program Files" on Windows, etc., so we will just use "real" Java
//						exec(command.join(" "));
			throw new Error("Unimplemented: jrunscript exec()");
		} else {
			var _command = Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.String,command.length);
			for (var i=0; i<command.length; i++) {
				_command[i] = command[i];;
			}
			var _builder = new Packages.java.lang.ProcessBuilder(_command);
			var USE_JAVA_1_7 = false;
			if (USE_JAVA_1_7) {
				var Redirect = Packages.java.lang.ProcessBuilder.Redirect;
				_builder.redirectOutput(Redirect.INHERIT).redirectError(Redirect.INHERIT);
			}
			if (p.directory) _builder.directory(p.directory);

			var _process = _builder.start();

			if (!USE_JAVA_1_7) {
				var spool = function(from,to) {
					var t = new Packages.java.lang.Thread(function() {
						var b;
						while( (b = from.read()) != -1 ) {
							to.write(b);
						}
						from.close();
						to.close();
					});
					t.start();
					return t;
				};

				var out = spool(_process.getInputStream(), Packages.java.lang.System.out);
				var err = spool(_process.getErrorStream(), Packages.java.lang.System.err);
			}

			//	TODO	error handling
			var exitStatus = _process.waitFor();
			out.join();
			err.join();
		}
	};
	
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
})();