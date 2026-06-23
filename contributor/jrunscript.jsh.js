//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,$api,jsh) {
		jsh.loader.plugins(jsh.script.file.parent);

		// var parameters = jsh.script.getopts({
		// 	options: {
		// 		java: jsh.script.getopts.ARRAY(jsh.file.Pathname),
		// 		engine: jsh.script.getopts.ARRAY(String),

		// 		//	TODO	browsers should go away, but is used for local testing of all locally installed and detected browsers
		// 		//	presently
		// 		browsers: false,

		// 		part: String,
		// 		//	https://github.com/davidpcaldwell/slime/issues/138
		// 		issue138: false,
		// 		//	TODO	Remove the dubious noselfping argument
		// 		noselfping: false,
		// 		//	TODO	review below arguments
		// 		tomcat: jsh.file.Pathname,
		// 		debug: false,
		// 		view: "console",
		// 		"chrome:profile": jsh.file.Pathname,
		// 		port: Number
		// 	},
		// 	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
		// });
		jsh.script.cli.main(
			$api.fp.pipe(
				jsh.script.cli.option.boolean({ longname: "noselfping" }),
				jsh.script.cli.option.boolean({ longname: "issue138" }),
				jsh.script.cli.option.string({ longname: "part" }),
				function(p) {
					const parameters = {
						options: $api.Object.compose(
							{
								engine: [""],
								tomcat: void(0),
								view: void(0),
								part: p.options.part,
								port: void(0)
							},
							p.options
						)
					};

					if (!parameters.options.view) parameters.options.view = "console";

					jsh.project.suite.initialize({
						selenium: false
					});

					// TODO: force CoffeeScript for verification?

					var environment = new jsh.project.suite.Environment({
						src: jsh.script.file.parent.parent,
						noselfping: parameters.options.noselfping,
						tomcat: true,
						executable: Boolean(jsh.shell.PATH.getCommand("gcc"))
					});

					var suite = new jsh.unit.html.Suite();

					//	TODO	Potentially valuable building blocks, but not here and not now, where we are testing a single engine
					// var launch = (
					// 	function() {
					// 		var launch = (jsh.shell.jsh.home) ? [jsh.shell.jsh.home.getRelativePath("jsh.js").toString()] : [jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js").toString(), "jsh"];
					// 		(
					// 			function addNashornBootstrapLibraries() {
					// 				var names = jsh.internal.bootstrap.nashorn.dependencies.names.concat(["nashorn"]);
					// 				//	TODO	Should only be used for versions of Java that need it
					// 				if (jsh.shell.jsh.home && jsh.shell.jsh.home.getFile("lib/nashorn.jar")) {
					// 					launch = [
					// 						"-classpath",
					// 						names.map(function(name) {
					// 							return jsh.shell.jsh.home.getRelativePath("lib/" + name + ".jar").toString();
					// 						//	TODO	below is platform-specific
					// 						}).join(":")
					// 					].concat(launch)
					// 				} else if (jsh.shell.jsh.src && jsh.shell.jsh.src.getFile("local/jsh/lib/nashorn.jar")) {
					// 					//	TODO	Should only be used for versions of Java that need it
					// 					launch = [
					// 						"-classpath",
					// 						names.map(function(name) {
					// 							return jsh.shell.jsh.src.getRelativePath("local/jsh/lib/" + name + ".jar").toString();
					// 						//	TODO	below is platform-specific
					// 						}).join(":")
					// 					].concat(launch)
					// 				}
					// 			}
					// 		)();
					//
					// 		return launch;
					// 	}
					// )();
					//
					// var engines = jsh.shell.run({
					// 	command: launcher,
					// 	arguments: launch.concat(["-engines"]),
					// 	stdio: {
					// 		output: String
					// 	},
					// 	evaluate: function(result) {
					// 		if (result.status) throw new Error("-engines exit status: " + result.status);
					// 		return JSON.parse(result.stdio.output);
					// 	}
					// });

					var jrunscript = (
						function() {
							var jdk = jsh.shell.java.Jdk.from.javaHome();
							var pathname = jsh.shell.java.Jdk.jrunscript(jdk);
							if (!pathname.present) throw new Error("Could not resolve jrunscript for JDK home: " + jdk.base);
							return pathname.value;
						}
					)();

					var engine = (
						function() {
							//	TODO	this is kind of clunky and seems to indicate a less clunky API should be available to get this
							//			string
							var ENGINE = jsh.internal.bootstrap.engine.resolve({
								rhino: function() { return "rhino"; },
								nashorn: function() { return "nashorn"; },
								graal: function() { return "graal"; }
							});
							var engine = ENGINE();
							return engine;
						}
					)();

					jsh.shell.console("Running " + jsh.shell.jsh.src + " with jrunscript " + jrunscript + " and engine " + engine + " ...");

					suite.add("jrunscript/fifty", jsh.unit.fifty.Part({
						shell: environment.jsh.unbuilt.src,
						script: environment.jsh.unbuilt.src.getFile("tools/fifty/test.jsh.js"),
						file: jsh.script.file.parent.getFile("jrunscript.fifty.ts")
					}));

					suite.add("jrunscript/jsapi", jsh.unit.Suite.Fork({
						name: "JSAPI Java tests for JRE " + jsh.shell.java.home.pathname.toString() + " and engine " + engine,
						run: jsh.shell.jsh,
						vmarguments: ["-Xms1024m"],
						shell: environment.jsh.src,
						script: jsh.script.file.parent.getFile("jrunscript-jsapi.jsh.js"),
						arguments: [
							"-shell:built", environment.jsh.built.location,
							"-view", "stdio"
						].concat(
							(parameters.options.noselfping) ? ["-noselfping"] : []
						).concat(
							(parameters.options.issue138) ? ["-issue138"] : []
						),
						environment: $api.Object.compose(
							jsh.shell.environment,
							(parameters.options.tomcat) ? { CATALINA_HOME: parameters.options.tomcat.toString() } : {},
							(engine) ? { JSH_ENGINE: engine.toLowerCase() } : {},
							(jsh.shell.rhino && jsh.shell.rhino.classpath) ? { JSH_ENGINE_RHINO_CLASSPATH: String(jsh.shell.rhino.classpath) } : {}
						)
					}));

					jsh.project.suite.run({
						view: parameters.options.view,
						port: parameters.options.port,
						part: parameters.options.part,
						suite: suite
					});

				}
			)
		)
	}
//@ts-ignore
)(Packages,$api,jsh);
