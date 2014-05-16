(function() {
	var $arguments = (function() {
		var rv = [];
		for (var i=0; i<this["javax.script.argv"].length; i++) {
			rv[i] = String(this["javax.script.argv"][i]);
		}
		return rv;
	})();

	var $engine = (function() {
		var jdk = new Packages.java.io.File(Packages.java.lang.System.getProperty("java.home"));

		var Nashorn = function() {
			this.filename = new Packages.java.lang.Throwable().getStackTrace()[0].getFileName();

			this.run = function(p) {
				Packages.java.lang.System.getProperties().put("jsh.build.arguments", p.arguments);
				Packages.java.lang.System.getProperties().put("jsh.build.src", $source);
				load(p.script);
			}
		};

		var Rhino = function(filename) {
			this.filename = filename;
			
			var downloadRhinoDistribution = function(url) {
				//	TODO	download from Mozilla, unzip and save just js.jar to a particular location
				throw new Error("Unimplemented: downloading Rhino from Mozilla; currently must use jsh.build.rhino system property to point to local js.jar");
			}
			
			var findRhino = function() {
				if (Packages.java.lang.System.getProperty("jsh.build.rhino")) {
					return new File(Packages.java.lang.System.getProperty("jsh.build.rhino"));
				} else {
					return downloadRhinoDistribution("ftp://ftp.mozilla.org/pub/mozilla.org/js/rhino1_7R3.zip");
				}
			}
			
			this.run = function(p) {
				//	Try to download Rhino
				var IN_PROCESS = false;
				if (IN_PROCESS) {
					Packages.java.lang.System.getProperties().put("jsh.build.arguments", p.arguments);
					Packages.java.lang.System.getProperties().put("jsh.build.src", $source);
					Packages.java.lang.System.getProperties().put("jsh.build.rhino", findRhino());
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
						}

						//	TODO	this does not seem to work; eval is essentially a no-op, for unknown reason
						var code = readFile(p.script.getCanonicalPath());
						eval(code);					
					} else {
						load(file);					
					}
				} else {
					var rhino = findRhino();
					//	TODO	In theory if we carefully constructed a ClassLoader we would not have to shell another process,
					//			maybe?
					var launcher = (function() {
						if (new File(jdk, "bin/java").exists()) return new File(jdk, "bin/java");
						if (new File(jdk, "bin/java.exe").exists()) return new File(jdk, "bin/java.exe");
					})();
					var command = [launcher.getCanonicalPath(),"-jar",rhino.getCanonicalPath(),"-opt","-1",p.script.getCanonicalPath()].concat(p.arguments);
					var JRUNSCRIPT_EXEC = false;
					if (JRUNSCRIPT_EXEC) {
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
						
						//	TODO	below requires Java 1.7
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
				}
			}
		};

		//	TODO	Come up with more robust way to detect; want to get access to javax.script.ScriptEngine but have not yet figured
		//			out how
		if (this["javax.script.filename"] == "<string>") {
			return new Nashorn();
		} else {
			return new Rhino(this["javax.script.filename"]);
		}
	})();

	var $script = (function() {
		var interpret = function(string) {
			if (new Packages.java.io.File(string).exists()) {
				return {
					file: new Packages.java.io.File(string)
				};
			} else {
				return {
					url: new Packages.java.net.URL(string)
				};
			}
		};

		return interpret($engine.filename);
	})();

	var $source = (function() {
		if ($script.file) {
			return new File($script.file, "../../..").getCanonicalFile();
		} else {
			//	TODO	implement determination of URL from Bitbucket
			println("Unimplemented: download from URL calculated using " + $script.url);
		}
	})();

	$engine.run({
		script: new Packages.java.io.File($source, "jsh/etc/unbuilt.rhino.js"),
		arguments: ["build"].concat($arguments)
	});	
})();
