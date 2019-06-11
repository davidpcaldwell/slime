//	TODO	detach from jsh
$exports.Installation = function(o) {
	this.toString = function() {
		return "Node installation at " + o.directory;
	};

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
