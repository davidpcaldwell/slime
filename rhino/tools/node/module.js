//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param {slime.jrunscript.node.Context} $context
	 * @param {slime.jrunscript.node.Exports} $exports
	 */
	function($api,$context,$exports) {
		var versions = {
			/** @type { { [os: string]: { [version: string]: { url: string } } } } */
			byOs: {
				"Mac OS X": {
					"8.16.2": { url: "https://nodejs.org/download/release/v8.16.2/node-v8.16.2-darwin-x64.tar.gz" },
					"12.13.1": { url: "https://nodejs.org/dist/v12.13.1/node-v12.13.1-darwin-x64.tar.gz" },
					"12.14.1": { url: "https://nodejs.org/dist/v12.14.1/node-v12.14.1-darwin-x64.tar.gz" },
					"12.16.0": { url: "https://nodejs.org/dist/v12.16.0/node-v12.16.0-darwin-x64.tar.gz" },
					"12.16.1": { url: "https://nodejs.org/dist/v12.16.1/node-v12.16.1-darwin-x64.tar.gz" },
					"12.16.2": { url: "https://nodejs.org/dist/v12.16.2/node-v12.16.2-darwin-x64.tar.gz" },
					"12.22.1": { url: "https://nodejs.org/download/release/v12.22.1/node-v12.22.1-darwin-x64.tar.gz"},
					"14.18.0": { url: "https://nodejs.org/dist/v14.18.0/node-v14.18.0-darwin-x64.tar.gz" },
					"16.13.1": { url: "https://nodejs.org/dist/v16.13.1/node-v16.13.1-darwin-x64.tar.gz" },
					"16.15.1": { url: "https://nodejs.org/dist/v16.15.1/node-v16.15.1-darwin-x64.tar.gz" },
					"16.17.1": { url: "https://nodejs.org/dist/v16.17.1/node-v16.17.1-darwin-x64.tar.gz" },
				},
				"Linux": {
					"12.22.1": { url: "https://nodejs.org/download/release/v12.22.1/node-v12.22.1-linux-x64.tar.gz" },
					"14.18.0": { url: "https://nodejs.org/dist/v14.18.0/node-v14.18.0-linux-x64.tar.gz" },
					"16.13.1": { url: "https://nodejs.org/dist/v16.13.1/node-v16.13.1-linux-x64.tar.gz" },
					"16.15.1": { url: "https://nodejs.org/dist/v16.15.1/node-v16.15.1-linux-x64.tar.gz" },
					"16.17.1": { url: "https://nodejs.org/dist/v16.17.1/node-v16.17.1-linux-x64.tar.gz" }
				}
			},
			default: "16.17.1"
		};

		var getDownload = function(version, os, arch) {
			if (arch == "aarch64") {
				if (version == "16.17.1") {
					return {
						url: "https://nodejs.org/dist/v16.17.1/node-v16.17.1-darwin-arm64.tar.gz"
					}
				}
			}
			var osVersions = versions.byOs[os];
			if (!osVersions) throw new TypeError("Unsupported operating system: " + $context.library.shell.os.name);
			var download = osVersions[version];
			return download;
		}

		var provider = ($context.world) || (
			/** @type { () => slime.jrunscript.node.World } */
			function() {
				return {
					install: function(p) {
						return function(events) {
							var existing = $exports.at({ location: p.location.toString() });
							if (existing) throw new Error("Node installation directory exists: " + p.location.toString());
							var version = getDownload(p.version, $context.library.shell.os.name, $context.library.shell.os.arch);
							$context.library.install.install({
								url: version.url,
								to: $context.library.file.Pathname(p.location)
							});
						}
					}
				}
			}
		)();

		/** @type { slime.jrunscript.node.Functions["Installation"]["getVersion"] } */
		function getVersion(installation) {
			return function(events) {
				var invocation = $context.library.shell.Invocation.create({
					command: installation.executable,
					arguments: ["--version"],
					stdio: {
						output: "string"
					}
				});
				var getExit = $api.Function.world.question(
					$context.library.shell.world.question
				);
				var exit = getExit(invocation);
				return exit.stdio.output.split("\n")[0];
			}
		}

		/** @type { (installation: slime.jrunscript.node.world.Installation) => string } */
		var getInstallationPathEntry = $api.Function.pipe(
			$api.Function.property("executable"),
			//	TODO	should be Location.from.os
			$context.library.file.world.Location.from.os,
			$context.library.file.world.Location.parent(),
			$api.Function.property("pathname")
		);

		/** @type { (project: string) => string } */
		var getProjectBin = $api.Function.pipe(
			$context.library.file.world.Location.from.os,
			$context.library.file.world.Location.relative(".bin"),
			$api.Function.property("pathname")
		)

		/**
		 *
		 * @param { string } pathname
		 * @param { string } name
		 */
		var directoryContains = function(pathname,name) {
			var directory = $context.library.file.world.Location.from.os(pathname);
			var location = $api.Function.result(directory, $context.library.file.world.Location.relative(name));
			return $api.Function.world.now.question(
				$context.library.file.world.Location.file.exists(),
				location
			);
		}

		/**
		 *
		 * @param { string } parent
		 * @param { string } path
		 */
		var getRelativePath = function(parent, path) {
			var base = $context.library.file.world.Location.from.os(parent);
			var target = $api.Function.result(base, $context.library.file.world.Location.relative(path));
			return target.pathname;
		}

		/** @type { (installation: slime.jrunscript.node.world.Installation) => (p: slime.jrunscript.node.Invocation) => slime.jrunscript.shell.invocation.Argument } */
		var node_invocation = function(installation) {
			return function(invocation) {
				var command = (
					function(bin,projectBin,command) {
						//	TODO	correct search order in project and node bin directories not known
						if (command) {
							if (projectBin && directoryContains(projectBin, command)) {
								return getRelativePath(projectBin, command);
							}
							if (directoryContains(bin, command)) {
								return getRelativePath(bin, command);
							}
						}
						return installation.executable;
					}
				)(
					getInstallationPathEntry(installation),
					(invocation.project) ? getProjectBin(invocation.project) : void(0),
					invocation.command
				);

				var path = (
					function() {
						if (invocation.environment && invocation.environment.PATH) {
							return $context.library.file.filesystems.os.Searchpath.parse(invocation.environment.PATH);
						}
						return $context.library.shell.PATH
					}
				)();

				var PATH = $api.Function.result(
					path,
					$api.Function.pipe(
						$api.Function.property("pathnames"),
						$api.Function.Array.prepend([
							$api.Function.result(getInstallationPathEntry(installation), $context.library.file.Pathname)
						]),
						$context.library.file.Searchpath,
						String
					)
				);

				var defaultEnvironment = (
					function(specified,process) {
						return specified || process;
					}
				)(invocation.environment,$context.library.shell.environment);

				return {
					command: command,
					arguments: invocation.arguments,
					environment: $api.Object.compose(
						defaultEnvironment,
						{
							PATH: PATH
						}
					),
					directory: invocation.directory,
					stdio: invocation.stdio
				}
			}
		}

		/** @type { slime.jrunscript.node.functions.Installation["modules"]["list"] } */
		var modules_list = function() {
			return function(installation) {
				var toShellInvocation = node_invocation(installation);

				return function(events) {
					var invocation = toShellInvocation({
						command: "npm",
						arguments: $api.Array.build(function(rv) {
							rv.push("ls");
							//	TODO	in latest npm, it reports this is deprecated and we should use --location=global instead.
							//			should check whether this has always worked or whether we need to do some kind of
							//			npm version checking here before choosing between the two forms
							rv.push("--global");
							rv.push("--depth", "0");
							rv.push("--json")
						}),
						stdio: {
							output: "string"
						}
					});

					var result = $api.Function.world.now.question(
						$context.library.shell.world.question,
						$context.library.shell.Invocation.create(invocation)
					);

					/** @type { slime.jrunscript.node.internal.NpmLsOutput } */
					var npmJson = JSON.parse(result.stdio.output);

					return $api.Function.result(
						npmJson,
						$api.Function.pipe(
							$api.Function.property("dependencies"),
							Object.entries,
							$api.Function.Array.map(function(entry) {
								return { name: entry[0], version: entry[1].version }
							})
						)
					);
				}
			}
		}

		/** @type { slime.jrunscript.node.functions.Installation["modules"]["installed"] } */
		var modules_installed = function(p) {
			return function(installation) {
				return function(events) {
					var ask = modules_list()(installation);
					var list = ask(void(0));
					var found = list.find(function(item) {
						return item.name == p;
					});
					return $api.Function.Maybe.from(found);
				}
			}
		};

		/** @type { slime.jrunscript.node.functions.Installation["modules"]["install"] } */
		var modules_install = function(p) {
			return function(installation) {
				var toShellInvocation = node_invocation(installation);

				return function(events) {
					var invocation = toShellInvocation({
						command: "npm",
						arguments: $api.Array.build(function(rv) {
							rv.push("install");
							//	TODO	in latest npm, it reports this is deprecated and we should use --location=global instead.
							//			should check whether this has always worked or whether we need to do some kind of
							//			npm version checking here before choosing between the two forms
							rv.push("--global");
							var package = (p.version) ? (p.name + "@" + p.version) : p.name;
							rv.push(package);
						})
					});

					$api.Function.world.now.action(
						$context.library.shell.world.action,
						$context.library.shell.Invocation.create(invocation)
					);
				}
			}
		};

		/** @type { slime.jrunscript.node.functions.Installation["modules"]["install"] } */
		var modules_require = function(p) {
			var isSatisfied = function(version) {
				/** @type { (installed: slime.$api.fp.Maybe<slime.jrunscript.node.world.Module>) => boolean } */
				return function(installed) {
					if (version) {
						return installed.present && installed.value.version == version;
					} else {
						return installed.present;
					}
				}
			}

			return function(installation) {
				return function(events) {
					var installed = modules_installed(p.name)(installation)(events);
					var satisfied = isSatisfied(p.version)(installed);
					if (!satisfied) {
						modules_install(p)(installation)(events);
					}
				}
			}
		}

		/**
		 * @param { { directory: slime.jrunscript.file.Directory } } o
		 * @constructor
		 */
		var Installation = function(o) {
			this.toString = function() {
				return "Node installation at " + o.directory;
			};

			//	TODO	below incantation required for TypeScript
			/** @property { slime.jrunscript.node.Version } */
			this.version = void(0);
			Object.defineProperty(this, "version", {
				get: function() {
					return $context.library.shell.run({
						command: o.directory.getFile("bin/node"),
						arguments: ["--version"],
						stdio: {
							output: String
						},
						evaluate: function(result) {
							return result.stdio.output.split("\n")[0];
						}
					});
				}
			});

			this.location = o.directory.toString();

			var PATH = (function() {
				var elements = $context.library.shell.PATH.pathnames.slice();
				elements.unshift(o.directory.getRelativePath("bin"));
				return $context.library.file.Searchpath(elements);
			})();

			/**
			 *
			 * @param { { directory: slime.jrunscript.file.Directory } } install
			 * @param { slime.jrunscript.file.Directory } project
			 * @param { string } command
			 */
			var getCommand = function(install,project,command) {
				if (command) {
					if (project) return project.getFile("node_modules/.bin/" + command);
					return o.directory.getFile("bin/" + command);
				}
				return install.directory.getFile("bin/node");
			};

			/** @type { slime.jrunscript.node.object.Installation["run"] } */
			this.run = function(p) {
				var command = getCommand(o, p.project, p.command);
				// var command = (function() {
				// 	if (p.command) {
				// 		if (p.project) return p.project.getFile("node_modules/.bin/" + p.command);
				// 		return o.directory.getFile("bin/" + p.command);
				// 	}
				// 	return o.directory.getFile("bin/node");
				// })();
				return $context.library.shell.run({
					command: command,
					arguments: p.arguments,
					directory: p.directory,
					//	TODO	not sure what's going on below with TypeScript, need to dig into the mutator concept
					//@ts-ignore
					environment: function(environment) {
						//	TODO	check for other types besides object, function, falsy
						//	TODO	can this be simplified further using mutator concept? Maybe; mutator could allow object and just return it
						environment.PATH = PATH.toString();
						var mutating = $api.Function.mutating(p.environment);
						var result = mutating(environment);
						if (!result.PATH) result.PATH = PATH.toString();

						//	TODO	what if NODE_PATH is set?
						environment.NODE_PATH = o.directory.getRelativePath("lib/node_modules")
					},
					stdio: p.stdio,
					evaluate: p.evaluate
				});
			};

			/** @type { slime.jrunscript.node.object.Installation["toBashScript"] } */
			this.toBashScript = function(p) {
				var inherit = (function(environment) {
					if (!environment) return true;
					if (typeof(environment.inherit) == "undefined") return true;
					return environment.inherit;
				})(p.environment);

				var PATH = (function(environment) {
					var was = (inherit) ? $context.library.shell.PATH : $context.library.file.Searchpath([]);
					var elements = was.pathnames.slice();
					elements.unshift(o.directory.getRelativePath("bin"));
					return $context.library.file.Searchpath(elements);
				})();

				return $context.library.shell.invocation.toBashScript()({
					command: getCommand(
						o,
						(p.project) ? $context.library.file.Pathname(p.project).directory : void(0),
						p.command
					),
					arguments: p.arguments,
					directory: p.directory,
					environment: {
						inherit: inherit,
						values: {
							PATH: PATH.toString(),
							NODE_PATH: o.directory.getRelativePath("lib/node_modules").toString()
						}
					}
				});
			}

			var npm = (function(run) {
				/**
				 * @type { slime.jrunscript.node.object.Installation["npm"]["run"] }
				 */
				var rv = function(p) {
					return run($api.Object.compose(p, {
						command: "npm",
						arguments: $api.Array.build(function(list) {
							list.push(p.command);
							if (p.global) {
								list.push("--global");
							}
							var mutating = $api.Function.mutating(p.arguments);
							var npmargs = mutating([]);
							list.push.apply(list, npmargs);
						})
					}));
				};
				return rv;
			})(this.run);

			this.modules = new function() {
				var installed = function() {
					var json = npm({
						command: "ls",
						global: true,
						arguments: [
							"--depth", "0", "--json"
						],
						stdio: {
							output: String
						},
						evaluate: function(result) {
							return JSON.parse(result.stdio.output);
						}
					});
					return json.dependencies;
				};

				this.installed = installed();

				var refresh = (function() {
					this.installed = installed();
				}).bind(this);

				//	TODO	used in tests; see whether that's needed
				this.refresh = refresh;

				this.install = function(p) {
					if (p.name) {
						npm({
							command: "install",
							global: true,
							arguments: [p.name]
						});
						refresh();
					}
				};

				/** @type { slime.jrunscript.node.object.Installation["modules"]["require"] } */
				this.require = $api.events.Function(function(p,events) {
					if (p.name) {
						if (!this.installed[p.name]) {
							events.fire("installing", p);
							this.install(p);
							events.fire("installed", p);
						} else {
							events.fire("already", p);
						}
					}
				});

				this.uninstall = function(p) {
					if (p.name) {
						npm({
							command: "uninstall",
							global: true,
							arguments: [p.name]
						});
						refresh();
					}
				};
			};

			this.npm = new function() {
				this.run = function(p) {
					return npm(p);
				}
			};
		};

		$exports.at = function(p) {
			if (!p.location) throw new TypeError("Required: 'location' property.");
			if (typeof(p.location) != "string") throw new TypeError("'location' property must be string.");
			var location = $context.library.file.Pathname(p.location);
			if (!location.directory) return null;
			return new Installation({
				directory: location.directory
			})
		};

		$exports.test = {
			versions: {
				previous: "14.18.0",
				current: versions.default
			},
			world: provider
		};

		$exports.install = function(p) {
			if (!p) throw new TypeError();
			//	TODO	compute this somehow?
			if (!p.version) p.version = versions.default;
			return function(events) {
				var existing = $exports.at({ location: p.location.toString() });
				if (existing) throw new Error("Node instlalation directory exists: " + p.location.toString());
				var version = getDownload(p.version, $context.library.shell.os.name, $context.library.shell.os.arch);
				$context.library.install.install({
					url: version.url,
					to: p.location
				});
				events.fire("installed", $exports.at({ location: p.location.toString() }));
			}
		};

		$exports.world = {
			Installation: {
				from: {
					location: function(location) {
						return {
							executable: $api.Function.result(location, $context.library.file.world.Location.relative("bin/node")).pathname
						}
					}
				},
				exists: function(installation) {
					return function(events) {
						return $api.Function.result(
							installation,
							$api.Function.pipe(
								$api.Function.property("executable"),
								$context.library.file.world.Location.from.os,
								$api.Function.world.question($context.library.file.world.Location.file.exists())
							)
						)
					}
				},
				getVersion: getVersion,
				question: function(argument) {
					return function(installation) {
						var shellArgument = node_invocation(installation)(argument);
						return function(events) {
							var ask = $context.library.shell.world.question(
								$context.library.shell.Invocation.create(
									shellArgument
								)
							);
							return ask(events);
						}
					}
				},
				modules: {
					list: modules_list,
					installed: modules_installed,
					install: modules_install,
					require: modules_require
				}
			}
		}
	}
	//@ts-ignore
)($api,$context,$exports)
