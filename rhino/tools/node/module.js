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
		/**
		 * @param { ConstructorParameters<slime.jrunscript.node.Exports["Installation"]>[0] } o
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
					var string = $context.module.shell.run({
						command: o.directory.getFile("bin/node"),
						arguments: ["--version"],
						stdio: {
							output: String
						},
						evaluate: function(result) {
							return result.stdio.output.split("\n")[0];
						}
					});
					return {
						toString: function() {
							return string;
						},
						number: string.substring(1)
					};
				}
			})

			var PATH = (function() {
				var elements = $context.module.shell.PATH.pathnames.slice();
				elements.unshift(o.directory.getRelativePath("bin"));
				return $context.module.file.Searchpath(elements);
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

			/** @type { slime.jrunscript.node.Installation["run"] } */
			this.run = function(p) {
				var command = getCommand(o, p.project, p.command);
				// var command = (function() {
				// 	if (p.command) {
				// 		if (p.project) return p.project.getFile("node_modules/.bin/" + p.command);
				// 		return o.directory.getFile("bin/" + p.command);
				// 	}
				// 	return o.directory.getFile("bin/node");
				// })();
				return $context.module.shell.run({
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

			/** @type { slime.jrunscript.node.Installation["toBashScript"] } */
			this.toBashScript = function(p) {
				var inherit = (function(environment) {
					if (!environment) return true;
					if (typeof(environment.inherit) == "undefined") return true;
					return environment.inherit;
				})(p.environment);

				var PATH = (function(environment) {
					var was = (inherit) ? $context.module.shell.PATH : $context.module.file.Searchpath([]);
					var elements = was.pathnames.slice();
					elements.unshift(o.directory.getRelativePath("bin"));
					return $context.module.file.Searchpath(elements);
				})();

				return $context.module.shell.invocation.toBashScript()({
					command: getCommand(
						o,
						(p.project) ? $context.module.file.Pathname(p.project).directory : void(0),
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
				 * @type { slime.jrunscript.node.Installation["npm"]["run"] }
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

				this.require = $api.Events.Function(function(p,events) {
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
			if (!p.location.directory) return null;
			return new $exports.Installation({
				directory: p.location.directory
			})
		};

		var versions = {
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
					"16.13.1": { url: "https://nodejs.org/dist/v16.13.1/node-v16.13.1-darwin-x64.tar.gz" }
				},
				"Linux": {
					"12.22.1": { url: "https://nodejs.org/download/release/v12.22.1/node-v12.22.1-linux-x64.tar.gz" },
					"14.18.0": { url: "https://nodejs.org/dist/v14.18.0/node-v14.18.0-linux-x64.tar.gz" },
					"16.13.1": { url: "https://nodejs.org/dist/v16.13.1/node-v16.13.1-linux-x64.tar.gz" }
				}
			},
			default: "16.13.1"
		};

		$exports.install = $api.events.Function(
			/**
			 *
			 * @param { Parameters<slime.jrunscript.node.Exports["install"]>[0] } p
			 * @param { slime.$api.Events<slime.jrunscript.node.install.Events> } events
			 * @returns
			 */
			function(p,events) {
				if (!p) throw new TypeError();
				//	TODO	compute this somehow?
				if (!p.version) p.version = versions.default;
				var existing = $exports.at({ location: p.location });
				/** @type { slime.jrunscript.node.Installation } */
				var rv;
				if (!existing || (existing.version.number != p.version && p.update)) {
					if (existing) {
						p.location.directory.remove();
					}
					var os = versions.byOs[$context.module.shell.os.name];
					if (!os) throw new TypeError("Unsupported operating system: " + $context.module.shell.os.name);
					var version = os[p.version];
					$context.library.install.install({
						url: version.url,
						to: p.location
					});
					rv = new $exports.Installation({
						directory: p.location.directory
					});
					events.fire("console", "Node " + rv.version + " installed.");
				} else {
					rv = existing;
					events.fire("console", "Node " + existing.version + " already installed.");
				}
				return rv;
			}
		);

		$exports.Installation = $api.deprecate(Installation);

		$exports.Project = function(o) {
			throw new Error();
		}


	}
	//@ts-ignore
)($api,$context,$exports)
