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
								java: [jsh.shell.java.home.pathname],
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

					jsh.java.Thread.start(
						/**
						 * At one point, builds were failing on Docker because `tsc` was not found when attempting to use TypeScript within
						 * tests. `tsc` would blink in and out of existence in the shell's library directory.
						 *
						 * This seems to be no longer happening.
						 *
						 * This function runs a thread that monitors the existence of the TypeScript compiler in the test suite shell and
						 * writes console messages if its status changes (it is removed, it reappears, etc.)
						 */
						function addDiagnosticForTscDisappearing() {
							/** @type { boolean } */
							var found;

							/** @type { boolean } */
							var now;

							while(true) {
								now = jsh.shell.jsh.src.getRelativePath("local/jsh/lib/node/bin/tsc").java.adapt().exists();
								if (typeof(found) == "undefined") {
									jsh.shell.console("Initial check: tsc found = " + now);
								} else if (found && !now) {
									jsh.shell.console("tsc change: removed");
									jsh.shell.console("node present? " + jsh.shell.jsh.src.getRelativePath("local/jsh/lib/node").java.adapt().exists());
								} else if (!found && now) {
									jsh.shell.console("tsc change: added");
								} else {
									//jsh.shell.console("tsc still " + now);
								}
								found = now;
								jsh.java.Thread.sleep(25);
							}
						}
					);

					// TODO: force CoffeeScript for verification?

					var hasGit = (
						function() {
							if (jsh.shell.environment.SLIME_TEST_NO_GIT) return false;
							return Boolean(jsh.shell.PATH.getCommand("git"));
						}
					)();

					var isGitClone = (function() {
						var SLIME = jsh.script.file.parent.parent;
						return Boolean(SLIME.getSubdirectory(".git") || SLIME.getFile(".git"));
					})();

					var environment = new jsh.project.suite.Environment({
						src: jsh.script.file.parent.parent,
						noselfping: parameters.options.noselfping,
						tomcat: true,
						executable: Boolean(jsh.shell.PATH.getCommand("gcc"))
					});

					var suite = new jsh.unit.html.Suite();

					parameters.options.java.forEach(function(jre,index,jres) {
						var JRE = (jres.length > 1) ? String(index) : "jre";

						suite.add("jrunscript/" + JRE + "/engines", new jsh.unit.Suite.Fork({
							run: jsh.shell.jsh,
							shell: environment.jsh.built.home,
							script: jsh.script.file.parent.getFile("jrunscript-engines.jsh.js"),
							arguments: [
								"-view", "stdio"
							]
						}));

						parameters.options.engine.forEach(function(engine) {
							var searchpath = jsh.file.Searchpath([jre.directory.getRelativePath("bin"),jre.directory.getRelativePath("../bin")]);

							var launcher = searchpath.getCommand("jrunscript");
							var launch = (jsh.shell.jsh.home) ? [jsh.shell.jsh.home.getRelativePath("jsh.js").toString()] : [jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js").toString(), "jsh"];
							(
								function addNashornBootstrapLibraries() {
									var names = jsh.internal.bootstrap.nashorn.dependencies.names.concat(["nashorn"]);
									//	TODO	Should only be used for versions of Java that need it
									if (jsh.shell.jsh.home && jsh.shell.jsh.home.getFile("lib/nashorn.jar")) {
										launch = [
											"-classpath",
											names.map(function(name) {
												return jsh.shell.jsh.home.getRelativePath("lib/" + name + ".jar").toString();
											//	TODO	below is platform-specific
											}).join(":")
										].concat(launch)
									} else if (jsh.shell.jsh.src && jsh.shell.jsh.src.getFile("local/jsh/lib/nashorn.jar")) {
										//	TODO	Should only be used for versions of Java that need it
										launch = [
											"-classpath",
											names.map(function(name) {
												return jsh.shell.jsh.src.getRelativePath("local/jsh/lib/" + name + ".jar").toString();
											//	TODO	below is platform-specific
											}).join(":")
										].concat(launch)
									}
								}
							)();

							var engines = jsh.shell.run({
								command: launcher,
								arguments: launch.concat(["-engines"]),
								stdio: {
									output: String
								},
								evaluate: function(result) {
									if (result.status) throw new Error("-engines exit status: " + result.status);
									return eval("(" + result.stdio.output + ")");
								}
							});

							if (engine && engines.indexOf(engine) == -1) {
								jsh.shell.console("Skipping engine " + engine + "; not available under " + launcher);
							} else {
								var ENGINE = (engine) ? engine : "engine";
								jsh.shell.console("Running " + jsh.shell.jsh.home + " with Java " + launcher + " and engine " + engine + " ...");

								suite.add("jrunscript/" + JRE + "/" + ENGINE + "/fifty", jsh.unit.fifty.Part({
									shell: environment.jsh.unbuilt.src,
									script: environment.jsh.unbuilt.src.getFile("tools/fifty/test.jsh.js"),
									file: jsh.script.file.parent.getFile("jrunscript.fifty.ts")
								}));

								suite.add("jrunscript/" + JRE + "/" + ENGINE + "/jsapi", jsh.unit.Suite.Fork({
									name: "JSAPI Java tests for JRE " + JRE + " and engine " + ENGINE,
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
							}
						});
					});

					(
						function safariLifecycle() {
							var getSafariProcess = function() {
								if (jsh.shell.os.name != "Mac OS X") return null;
								var processes = jsh.shell.os.process.list();
								var safaris = processes.filter(function(process) {
									return process.command == "/Applications/Safari.app/Contents/MacOS/Safari";
								});
								return (safaris.length) ? safaris[0] : null;
							};

							var safariWas = getSafariProcess();

							if (!safariWas) {
								jsh.java.addShutdownHook(function() {
									var safari = getSafariProcess();
									if (safari) safari.kill();
								});
							}
						}
					)();

					//	TODO	this is probably obsolete at this point, as we move toward a set of GitHub Actions that test various parts of
					//			the system
					if (jsh.unit.browser && false) suite.add("browsers", new function() {
						var browsers = jsh.unit.browser.installed;

						this.name = "Browser tests";

						this.parts = new function() {
							this.jsapi = {
								parts: {}
							};

							this.fifty = {
								parts: {}
							};

							browsers.forEach(function(browser) {
								this.jsapi.parts[browser.id] = jsh.unit.Suite.Fork({
									name: browser.name + " jsapi",
									run: jsh.shell.jsh,
									//	TODO	was environment.jsh.home, but that seemed to be a bug, so replacing with what value actually
									//			seemed to be.
									shell: void(0),
									script: environment.jsh.src.getFile("loader/browser/test/suite.jsh.js"),
									arguments: [
										"-suite", environment.jsh.src.getFile("contributor/browser-jsapi-suite.js"),
										"-browser", browser.id,
										"-view", "stdio"
									].concat(p.arguments),
									// TODO: is setting the working directory necessary?
									directory: environment.jsh.src
								});
							},this);

							this.fifty = (
								/** @returns { { parts: { [x: string]: any } } } */
								function() {
									/** @type { { [x: string]: any }} */
									var parts = {};
									browsers.forEach(function(browser) {
										parts[browser.id] = jsh.unit.Suite.Fork({
											name: "Fifty (" + browser.name + ")",
											run: jsh.shell.run,
											command: environment.jsh.src.getFile("fifty"),
											arguments: [
												"test.browser",
												"--browser", browser.id,
												environment.jsh.src.getFile("contributor/browser.fifty.ts")
											],
											directory: environment.jsh.src
										});
									});
									return { parts: parts };
								}
							)();
						}
					});

					if (hasGit && isGitClone) suite.add(
						"project",
						{
							parts: {
								wf: jsh.unit.fifty.Part({
									shell: environment.jsh.unbuilt.src,
									script: environment.jsh.unbuilt.src.getFile("tools/fifty/test.jsh.js"),
									file: environment.jsh.unbuilt.src.getFile("wf.fifty.ts")
								})
							}
						}
					);

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
