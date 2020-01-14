//@ts-check

/**
 * @typedef {object} slime.jrunscript.node.Context
 */

/**
 * @typedef {object} slime.jrunscript.node.Version
 * @property {string} number
 */

/**
 * @typedef {object} slime.jrunscript.node.Installation
 * @property {slime.jrunscript.node.Version} version
 * @property {Function} run
 * @property {object} modules
 * @property {object} npm
 */

/**
 * @typedef { (p: { location: slime.jrunscript.file.Pathname, version?: string, update?: boolean } ) => slime.jrunscript.node.Installation } slime.jrunscript.node.install
 */

/**
 * @typedef {object} slime.jrunscript.node.Exports
 * @property { new (o: any) => slime.jrunscript.node.Installation } Installation
 * @property {Function} at
 * @property { slime.jrunscript.node.install } install
 * @property {Function} Project
 */

void(0);

(
	/**
	 * @param {slime.jrunscript.node.Context} $context
	 * @param {slime.jrunscript.node.Exports} $exports
	 */
	function($context,$exports) {
		/**
		 * @constructor
		 */
		$exports.Installation = function(o) {
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
							return result.stdio.output;
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
				elements.push(o.directory.getRelativePath("bin"));
				return $context.module.file.Searchpath(elements);
			})();

			this.run = function(p) {
				var command = (function() {
					if (p.command) {
						if (p.project) return p.project.getFile("node_modules/.bin/" + p.command);
						return o.directory.getFile("bin/" + p.command);
					}
					return o.directory.getFile("bin/node");
				})();
				return $context.module.shell.run({
					command: command,
					arguments: p.arguments,
					directory: p.directory,
					environment: function(environment) {
						//	TODO	check for other types besides object, function, falsy
						//	TODO	can this be simplified further using mutator concept? Maybe; mutator could allow object and just return it
						environment.PATH = PATH.toString();
						var mutating = $api.Function.mutating(p.environment);
						var result = mutating(environment);
						if (!result.PATH) result.PATH = PATH.toString();
					},
					stdio: p.stdio,
					evaluate: p.evaluate
				});
			}

			var npm = (function(run) {
				return function(p) {
					return run($api.Object.compose(p, {
						command: "npm",
						arguments: function(list) {
							list.push(p.command);
							if (p.global) {
								list.push("--global");
							}
							var mutating = $api.Function.mutating(p.arguments);
							var npmargs = mutating([]);
							list.push.apply(list, npmargs);
						}
					}));
				};
			})(this.run);

			this.modules = new function() {
				var Installed = function() {
					var node_modules = o.directory.getSubdirectory("lib/node_modules");
					if (node_modules) {
						node_modules.list().forEach(function(item) {
							this[item.pathname.basename] = {};
						},this);
					}
				}

				this.installed = new Installed();

				this.refresh = function() {
					this.installed = new Installed();
				}

				this.install = function(p) {
					if (p.name) {
						npm({
							command: "install",
							global: true,
							arguments: [p.name]
						});
						this.refresh();
					}
				};

				this.uninstall = function(p) {
					if (p.name) {
						npm({
							command: "uninstall",
							global: true,
							arguments: [p.name]
						});
						this.refresh();
					}
				};
			};

			this.npm = new function() {
				this.run = function(p) {
					return npm(p);
				}
			};
		};

		$exports.Project = function(o) {
			throw new Error();
		}

		var versions = {
			"12.13.1": { url: "https://nodejs.org/dist/v12.13.1/node-v12.13.1-darwin-x64.tar.gz" },
			"12.14.1": { url: "https://nodejs.org/dist/v12.14.1/node-v12.14.1-darwin-x64.tar.gz" }
		};

		$exports.at = function(p) {
			if (!p.location) throw new TypeError("Required: 'location' property.");
			if (!p.location.directory) return null;
			return new $exports.Installation({
				directory: p.location.directory
			})
		};

		$exports.install = $api.Events.Function(
			/** @type { slime.jrunscript.node.install } */
			function(p,events) {
				if (!p) throw new TypeError();
				if (!p.version) p.version = "12.14.1";
				var existing = $exports.at({ location: p.location });
				/** @type { slime.jrunscript.node.Installation } */
				var rv;
				if (!existing || (existing.version != p.version && p.update)) {
					if (existing) {
						p.location.directory.remove();
					}
					var version = versions[p.version];
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
	}
	//@ts-ignore
)($context,$exports)
