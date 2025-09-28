//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		var parameters = jsh.script.getopts({
			options: {
				part: String,
				view: "console"
			}
		});

		/** @type { slime.project.internal.jrunscript_environment.Exports } */
		var Environment = jsh.script.loader.module("jrunscript-environment.js");

		var environment = new Environment({
			src: jsh.script.file.parent.parent,
			noselfping: parameters.options.noselfping,
			tomcat: true,
			executable: Boolean(jsh.shell.PATH.getCommand("gcc"))
		});

		var engines = jsh.shell.run({
			command: "bash",
			arguments: [environment.jsh.unbuilt.src.getFile("jsh.bash"),"-engines"],
			stdio: {
				output: String
			},
			evaluate: function(result) {
				return JSON.parse(result.stdio.output);
			}
		});

		var suite = new jsh.unit.html.Suite();

		engines.forEach(function(engine) {
			suite.add(engine, {
				parts: new function() {
					this.property = {
						// TODO: tests unbuilt shells only because built shells would not necessarily have the same libraries (Rhino/Graal).
						// will need to revisit this.
						// TODO: consider migrating to and combining with jsh/launcher/internal.api.html
						execute: function(scope,verify) {
							//	Workaround to get prerequisites installed for standalone Nashorn shells
							var result = $api.fp.now.map(
								{
									command: "bash",
									arguments: $api.Array.build(function(rv) {
										rv.push(environment.jsh.unbuilt.src.getRelativePath("jsh").toString());
										rv.push(environment.jsh.src.getFile("jrunscript/jsh/test/jsh-data.jsh.js"));
									}),
									environment: function(existing) {
										return $api.Object.compose(existing, {
											JSH_ENGINE: engine
										})
									},
									stdio: {
										output: "string"
									}
								},
								$api.fp.world.Sensor.old.mapping({ sensor: jsh.shell.subprocess.question })
							);
							var output = jsh.shell.jsh({
								shell: environment.jsh.unbuilt.src,
								script: environment.jsh.src.getFile("jrunscript/jsh/test/jsh-data.jsh.js"),
								environment: Object.assign({}, jsh.shell.environment, {
									JSH_ENGINE: engine
								}),
								stdio: {
									output: String
								},
								evaluate: function(result) {
									if (result.status != 0) return {
										error: true,
										properties: {}
									}
									return JSON.parse(result.stdio.output);
								}
							});
							verify(output).properties.evaluate.property("jsh.engine").is(engine);
						}
					};

					var SRC = environment.jsh.src;

					this.runtime = jsh.unit.Suite.Fork({
						name: "SLIME Java runtime",
						run: jsh.shell.jsh,
						shell: SRC,
						script: SRC.getFile("loader/jrunscript/test/suite.jsh.js"),
						arguments: ["-view", "stdio"],
						environment: $api.Object.compose(jsh.shell.environment, {
							JSH_ENGINE: engine
						})
					});

					if (engine == "rhino") this.optimization = {
						execute: function(scope,verify) {
							[-1,0,1].forEach(function(level) {
								if (environment.jsh.unbuilt.src.getFile("local/jsh/lib/coffee-script.js")) {
									// TODO: If CoffeeScript is present, jsh should completely ignore optimization level
									jsh.shell.console("Skipping Rhino optimization tests for level " + level + "; CoffeeScript present.");
									return;
								}

								//	TODO	would be nice to have type safety here
								var result = jsh.shell.jsh({
									shell: environment.jsh.unbuilt.src,
									script: environment.jsh.src.getFile("jrunscript/jsh/test/jsh-data.jsh.js"),
									environment: jsh.js.Object.set({}, jsh.shell.environment, {
										JSH_ENGINE: "rhino",
										JSH_ENGINE_RHINO_OPTIMIZATION: String(level)
									}),
									stdio: {
										output: String
									},
									evaluate: function(result) {
										return JSON.parse(result.stdio.output);
									}
								});

								/**
								 * @param { string } implementationVersion
								 * @param { number } specified
								 */
								var expectedRhinoOptimizationLevel = function(implementationVersion,specified) {
									var parseRhinoVersion = $api.fp.pipe(
										$api.fp.RegExp.exec(/^Rhino (.*)/),
										$api.fp.Maybe.map(
											$api.fp.pipe(
												function(match) { return match[1]; },
												$api.fp.string.split("."),
												$api.fp.Array.map(Number)
											)
										)
									);

									if (specified == -1) return -1;
									var version = parseRhinoVersion(implementationVersion);
									if (version.present) {
										if (version.value[0] > 1) return 9;
										if (version.value[1] >= 8) return 9;
									}
									return specified;
								};

								verify(result).engines.current.name.is("rhino");
								verify(result).engines.current.optimization.is(expectedRhinoOptimizationLevel(result.engines.current.version,level));
							});
						}
					}
				}
			});
		});

		jsh.unit.html.cli({
			suite: suite,
			part: parameters.options.part,
			view: parameters.options.view
		});
	}
//@ts-ignore
)($api,jsh);
