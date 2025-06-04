//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param {slime.jrunscript.tools.node.Context} $context
	 * @param {slime.jrunscript.tools.node.Exports} $exports
	 */
	function($api,$context,$exports) {
		/** @type { (p: { version: string, os: string, arch: string }) => slime.$api.fp.Maybe<string> } */
		var getDownloadUrl = function(p) {
			var toNodeVersion = function(version) { return "v" + version; };

			var javaOsToNodeOs = $api.fp.pipe(
				/** @param { string } os */
				function(os) {
					if (os == "Mac OS X") return "darwin";
					if (os == "Linux") return "linux";
				},
				$api.fp.Maybe.from.value
			);

			var javaArchToNodeArch = $api.fp.pipe(
				function(arch) {
					if (arch == "x86_64") return "x64";
					if (arch == "amd64") return "x64";
					if (arch == "aarch64") return "arm64";
				},
				$api.fp.Maybe.from.value
			);

			var version = toNodeVersion(p.version);
			var os = javaOsToNodeOs(p.os);
			var arch = javaArchToNodeArch(p.arch);

			if (!os.present) return $api.fp.Maybe.from.nothing();
			if (!arch.present) return $api.fp.Maybe.from.nothing();
			return $api.fp.Maybe.from.some("https://nodejs.org/dist/" + version + "/node-" + version + "-" + os.value + "-" + arch.value + ".tar.gz");
		};

		var versions = {
			default: $api.fp.thunk.value("22.16.0")
		};

		$exports.versions = versions;

		var getDownload = function(version, os, arch) {
			var url = getDownloadUrl({
				version: version,
				os: os,
				arch: arch
			});
			if (url.present) {
				var prefix = $api.fp.now(
					url.value,
					$api.fp.string.split("/"),
					function(array) { return array[array.length-1]; },
					$api.fp.string.match(/(.*)\.tar.gz$/),
					function(match) {
						return match[1];
					}
				)
				return {
					prefix: prefix,
					url: url.value
				}
			}
			throw new Error("Unsupported version-OS-arch: " + version + "-" + os + "-" + arch);
		}

		var provider = (
			function() {
				return {
					/**
					 * @type { slime.$api.fp.world.Means<{ location: string, version: string },void> } p
					 */
					install: function(p) {
						return function(events) {
							var existing = $exports.object.at({ location: p.location.toString() });
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

		/** @type { slime.jrunscript.tools.node.exports.Installations["getVersion"] } */
		function getVersion(installation) {
			return function(events) {
				/** @type { slime.jrunscript.shell.run.Intention } */
				var intention = {
					command: installation.executable,
					arguments: ["--version"],
					stdio: {
						output: "string"
					}
				};
				var exit = $api.fp.world.now.question(
					$context.library.shell.subprocess.question,
					intention
				)
				return exit.stdio.output.split("\n")[0];
			}
		}

		/**
		 * Returns a string that can be added to the system path for this installation.
		 *
		 * @type { (installation: slime.jrunscript.tools.node.Installation) => string }
		 */
		var getInstallationPathEntry = $api.fp.pipe(
			$api.fp.property("executable"),
			//	TODO	should be Location.from.os
			$context.library.file.Location.from.os,
			$context.library.file.Location.parent(),
			$api.fp.property("pathname")
		);

		/** @type { (project: string) => string } */
		var getProjectBin = $api.fp.pipe(
			$context.library.file.Location.from.os,
			$context.library.file.Location.directory.relativePath(".bin"),
			$api.fp.property("pathname")
		)

		/**
		 *
		 * @param { string } pathname
		 * @param { string } name
		 */
		var directoryContains = function(pathname,name) {
			var directory = $context.library.file.world.Location.from.os(pathname);
			var location = $api.fp.result(directory, $context.library.file.world.Location.relative(name));
			return $api.fp.world.now.question(
				$context.library.file.world.Location.file.exists.world(),
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
			var target = $api.fp.result(base, $context.library.file.world.Location.relative(path));
			return target.pathname;
		};

		/**
		 * Determines the shell command to use for a Node installation and intention. If a command is specified, the project
		 * and Node bin directories will be searched for it. Otherwise, the Node.js `node` launcher will be used.
		 *
		 * @param { slime.jrunscript.tools.node.Installation } installation
		 * @param { slime.jrunscript.tools.node.Intention } intention
		 * @returns { string } The executable to use when running the command in the shell
		 */
		var getExecutableForCommand = function(installation, intention) {
			var projectBin = (intention.project) ? getProjectBin(intention.project) : void(0);
			var command = intention.command
			var bin = getInstallationPathEntry(installation);
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

		/**
		 * @param { { installation: slime.jrunscript.tools.node.Installation, project?: slime.jrunscript.tools.node.Project }} p
		 * @returns
		 */
		var Modules = function(p) {
			/** @type { slime.jrunscript.tools.node.exports.Modules["list"] } */
			var list = function() {
				return function(events) {
					// var invocation = toShellInvocation({
					// 	command: "npm",
					// 	arguments: $api.Array.build(function(rv) {
					// 		rv.push("ls");
					// 		//	TODO	in latest npm, it reports this is deprecated and we should use --location=global instead.
					// 		//			should check whether this has always worked or whether we need to do some kind of
					// 		//			npm version checking here before choosing between the two forms
					// 		if (!p.project) rv.push("--global");
					// 		rv.push("--depth", "0");
					// 		rv.push("--json")
					// 	}),
					// 	directory: (p.project) ? p.project.base : $api.fp.now(
					// 		p.installation.executable,
					// 		$context.library.file.Location.from.os,
					// 		$context.library.file.Location.parent(),
					// 		$api.fp.property("pathname")
					// 	),
					// 	stdio: {
					// 		output: "string",
					// 		error: "string"
					// 	}
					// });

					(
						function() {
							var invocation = invokeNpm(
								p.installation,
								{
									command: "install",
									arguments: $api.Array.build(function(rv) {
									}),
									directory: (p.project) ? p.project.base : void(0),
									stdio: {
										output: "string",
										error: "string"
									}
								}
							);
							var result = $api.fp.world.now.question(
								$context.library.shell.subprocess.question,
								invocation
							);
							return result;
						}
					)();

					var invocation = invokeNpm(
						p.installation,
						{
							command: "ls",
							arguments: $api.Array.build(function(rv) {
								//	TODO	in latest npm, it reports this is deprecated and we should use --location=global instead.
								//			should check whether this has always worked or whether we need to do some kind of
								//			npm version checking here before choosing between the two forms
								rv.push("-l");
								if (!p.project) rv.push("--global");
								rv.push("--depth", "0");
								rv.push("--json")
							}),
							directory: (p.project) ? p.project.base : void(0) /*$api.fp.now(
								p.installation.executable,
								$context.library.file.Location.from.os,
								$context.library.file.Location.parent(),
								$api.fp.property("pathname")
							)*/,
							stdio: {
								output: "string",
								error: "string"
							}
						}
					);
					var result = $api.fp.world.now.question(
						$context.library.shell.subprocess.question,
						invocation
					);

					if (result.status != 0) {
						throw new Error("npm ls exit status: " + result.status
							+ "\ninstallation: " + JSON.stringify(p.installation)
							+ "\ninvocation: " + JSON.stringify(invocation)
							+ "\nstdout:\n" + result.stdio.output
							+ "\nstderr:\n" + result.stdio.error);
					}

					/** @type { slime.jrunscript.tools.node.internal.NpmLsOutput } */
					var npmJson = JSON.parse(result.stdio.output);

					if (!npmJson.dependencies) return [];
					return $api.fp.result(
						npmJson,
						$api.fp.pipe(
							$api.fp.property("dependencies"),
							Object.entries,
							$api.fp.Array.map(function(entry) {
								return {
									name: entry[0],
									version: entry[1].version,
									path: entry[1].path,
									bin: entry[1].bin
								}
							})
						)
					);
				}
			};

			/** @type { slime.jrunscript.tools.node.exports.Modules["installed"] } */
			var installed = function(name) {
				return function(events) {
					var ask = list();
					var listing = ask(void(0));
					var found = listing.find(function(item) {
						return item.name == name;
					});
					return $api.fp.Maybe.from.value(found);
				}
			};

			/** @type { slime.jrunscript.tools.node.exports.Modules["install"] } */
			var install = function(spec) {
				return function(events) {
					var invocation = invokeNpm(
						p.installation,
						{
							command: "install",
							arguments: $api.Array.build(function(rv) {
								//	TODO	in latest npm, it reports this is deprecated and we should use --location=global instead.
								//			should check whether this has always worked or whether we need to do some kind of
								//			npm version checking here before choosing between the two forms
								if (!p.project) rv.push("--global");
								var package = (spec.version) ? (spec.name + "@" + spec.version) : spec.name;
								rv.push(package);
							}),
							directory: (p.project) ? p.project.base : void(0),
							stdio: void(0)
						}
					);

					$api.fp.world.now.action(
						$context.library.shell.subprocess.action,
						invocation
					);
				}
			};

			return /** @type { slime.jrunscript.tools.node.exports.Modules } */({
				list: list,
				installed: installed,
				install: install,
				require: function(spec) {
					var isSatisfied = function(version) {
						/** @type { (installed: slime.$api.fp.Maybe<slime.jrunscript.tools.node.Module>) => boolean } */
						return function(installed) {
							if (version) {
								return installed.present && installed.value.version == version;
							} else {
								return installed.present;
							}
						}
					}

					return function(events) {
						var found = installed(spec.name)(events);
						events.fire("found", found);
						var satisfied = isSatisfied(spec.version)(found);
						if (!satisfied) {
							events.fire("installing", spec);
							install(spec)(events);
							found = installed(spec.name)(events);
							if (found.present) {
								events.fire("installed", found.value);
							} else {
								throw new Error("Unreachable: " + spec.name + " not found after installation.");
							}
						}
					}
				},
				project: (p.project) ? {
					install: function() {
						var invocation = invokeNpm(
							p.installation,
							{
								command: "install",
								arguments: [],
								directory: p.project.base,
								stdio: void(0)
							}
						);

						$api.fp.world.now.action(
							$context.library.shell.subprocess.action,
							invocation
						);
					}
				} : void(0)
			});
		};

		//	For now, this special way of invoking npm seems necessary to make this work on a Docker volume.
		//	See https://stackoverflow.com/questions/79149637/on-macos-tar-x-within-docker-container-does-not-create-symlinks
		/**
		 * @param { slime.jrunscript.tools.node.Installation } installation
		 * @param { { command: string, arguments: string[], directory: string, stdio: slime.jrunscript.shell.run.Intention["stdio"] }} invocation
		 * @returns { slime.jrunscript.shell.run.Intention }
		 */
		var invokeNpm = function(installation,invocation) {
			var nodeBase = $api.fp.now(
				installation.executable,
				$context.library.file.Location.from.os,
				$context.library.file.Location.parent(),
				$context.library.file.Location.parent()
			);

			return {
				command: installation.executable,
				arguments: $api.Array.build(function(rv) {
					rv.push(
						$api.fp.now(
							nodeBase,
							$context.library.file.Location.directory.relativePath("lib/node_modules/npm/bin/npm-cli.js"),
							$api.fp.property("pathname")
						)
					);
					rv.push(invocation.command);
					rv.push.apply(rv, invocation.arguments);
				}),
				directory: invocation.directory,
				stdio: invocation.stdio
			};
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
					if (!o.directory.getFile("bin/node")) throw new Error("Node executable missing at " + o.directory);
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

			/** @type { slime.jrunscript.tools.node.object.Installation["run"] } */
			this.run = function(p) {
				debugger;
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
						var mutating = $api.fp.mutating(p.environment);
						var result = mutating(environment);
						if (!result.PATH) result.PATH = PATH.toString();

						//	TODO	what if NODE_PATH is set?
						environment.NODE_PATH = o.directory.getRelativePath("lib/node_modules")
					},
					stdio: p.stdio,
					evaluate: p.evaluate
				});
			};

			/** @type { slime.jrunscript.tools.node.object.Installation["toBashScript"] } */
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
				 * @type { slime.jrunscript.tools.node.object.Installation["npm"]["run"] }
				 */
				var rv = function(p) {
					return run($api.Object.compose(p, {
						command: "npm",
						arguments: $api.Array.build(function(list) {
							list.push(p.command);
							if (p.global) {
								list.push("--global");
							}
							var mutating = $api.fp.mutating(p.arguments);
							var npmargs = mutating([]);
							list.push.apply(list, npmargs);
						}),
						environment: p.environment
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

				this.installed = void(0);
				Object.defineProperty(
					this,
					"installed",
					{
						get: $api.fp.impure.Input.memoized(installed)
					}
				);

				var refresh = (function() {
					Object.defineProperty(
						this,
						"installed",
						{
							get: $api.fp.impure.Input.memoized(installed)
						}
					);
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

				/** @type { slime.jrunscript.tools.node.object.Installation["modules"]["require"] } */
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

		$exports.test = {
			versions: {
				previous: "14.18.0",
				current: versions.default()
			}
		};

		$exports.object = {
			install: function(p) {
				if (!p) throw new TypeError();
				//	TODO	compute this somehow?
				if (!p.version) p.version = versions.default();
				return function(events) {
					var existing = p.location.directory;
					if (existing) throw new Error("Node installation directory exists: " + p.location.toString());
					var version = getDownload(p.version, $context.library.shell.os.name, $context.library.shell.os.arch);
					debugger;
					var action = $context.library.install.Distribution.install.world({
						download: version,
						to: p.location.toString()
					});
					$api.fp.world.Action.now({
						action: action
					});
					// $context.library.install.install({
					// 	url: version.url,
					// 	to: p.location
					// });
					var installed = $exports.object.at({ location: p.location.toString() });
					if (!installed) throw new Error("Install failed: " + p.location.toString());
					events.fire("installed", installed);
				}
			},
			at: function(p) {
				if (!p.location) throw new TypeError("Required: 'location' property.");
				if (typeof(p.location) != "string") throw new TypeError("'location' property must be string.");
				var location = $context.library.file.Pathname(p.location);
				if (!location.directory) return null;
				if (!location.directory.getFile("bin/node")) return null;
				return new Installation({
					directory: location.directory
				})
			}
		}

		$exports.install = function(to) {
			return function(p) {
				return function(events) {
					provider.install({ location: to, version: p.version })(events);
				}
			}
		};

		/** @type { (installation: slime.jrunscript.tools.node.Installation) => (intention: slime.jrunscript.tools.node.Intention) => slime.jrunscript.shell.run.Intention } */
		var node_intention = function(installation) {
			return function(intention) {
				var command = getExecutableForCommand(
					installation,
					intention
				);

				return {
					command: command,
					arguments: intention.arguments,
					environment: function(was) {
						var delegated = (intention.environment) ? intention.environment(was) : was;

						var searchpath = (delegated.PATH) ? $context.library.file.filesystems.os.Searchpath.parse(delegated.PATH) : null;

						/** @type { slime.$api.fp.Identity<slime.jrunscript.file.Searchpath> } */
						var asSearchpath = $api.fp.identity;

						var pathWithNodeBinPrepended = $api.fp.pipe(
							asSearchpath,
							$api.fp.property("pathnames"),
							$api.fp.Array.prepend([
								$api.fp.now.invoke(getInstallationPathEntry(installation), $context.library.file.Pathname)
							]),
							$context.library.file.Searchpath,
							String
						)

						return $api.Object.compose(
							delegated,
							{
								PATH: $api.fp.impure.now.input(
									$api.fp.impure.Input.value(
										searchpath,
										pathWithNodeBinPrepended
									)
								)
							}
						)
					},
					directory: intention.directory,
					stdio: intention.stdio
				}
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.tools.node.Intention } argument
		 * @returns { (installation: slime.jrunscript.tools.node.Installation) => slime.$api.fp.world.Question<slime.jrunscript.shell.run.AskEvents,slime.jrunscript.shell.run.Exit> }
		 */
		var Intention_question = function(argument) {
			return function(installation) {
				return function(events) {
					var ask = $context.library.shell.subprocess.question(node_intention(installation)(argument));
					return ask(events);
				}
			}
		};

		$exports.Installation = {
			from: {
				location: function(location) {
					return {
						executable: $api.fp.now.invoke(
							location,
							$context.library.file.Location.directory.relativePath("bin/node"),
							$api.fp.property("pathname")
						)
					}
				}
			},
			exists: (
				function() {
					/** @type { slime.jrunscript.tools.node.exports.Installations["exists"]["wo"] } */
					var wo = function(installation) {
						return function(events) {
							return $api.fp.now.invoke(
								installation,
								$api.fp.pipe(
									$api.fp.property("executable"),
									$context.library.file.Location.from.os,
									$api.fp.world.mapping($context.library.file.Location.file.exists.world())
								)
							)
						}
					};

					return {
						wo: wo,
						simple: $api.fp.now(wo, $api.fp.world.Sensor.mapping())
					};
				}
			)(),
			getVersion: getVersion,
			question: Intention_question,
			Intention: {
				shell: function(intention) {
					return function(installation) {
						return node_intention(installation)(intention);
					}
				},
				question: Intention_question
			},
			modules: function(installation) {
				return Modules({
					installation: installation
				});
			}
		};

		$exports.Project = {
			modules: function(project) {
				return function(installation) {
					return Modules({
						installation: installation,
						project: project
					})
				}
			}
		};
	}
	//@ts-ignore
)($api,$context,$exports)
