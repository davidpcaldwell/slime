//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var git = function(p) {
	debugger;
	return jsh.shell.run(
		jsh.js.Object.set({},
			p,
			{
				command: $context.program,
				arguments: [p.command].concat( (p.arguments) ? p.arguments : [] )
			}
		)
	);
};

var RemoteRepository = function(o) {
	this.toString = function() {
		return "git remote: " + o.remote;
	}

	var environment = (o && o.environment) ? o.environment : {};

	this.reference = o.remote;

	this.clone = function(p) {
		if (!p.to) {
			throw new Error("Required: 'to' property indicating destination.");
		}
		git({
			command: "clone",
			arguments: [o.remote,p.to.toString()],
			environment: jsh.js.Object.set({}, jsh.shell.environment, environment)
		});
	}
};

var LocalRepository = function(o) {
	this.base = o.local;

	this.toString = function() {
		return "git local: " + o.local;
	};

	["getRelativePath","getFile","getSubdirectory"].forEach(function(method) {
		this[method] = function() {
			return o.local[method].apply(o.local,arguments);
		}
	},this);

	var execute = function(p) {
		var environment = (o && o.environment) ? o.environment : {};
		return jsh.shell.run(jsh.js.Object.set({}, p, {
			command: $context.program,
			arguments: [p.command].concat( (p.arguments) ? p.arguments : [] ),
			environment: jsh.js.Object.set({}, jsh.shell.environment, environment),
			directory: o.local
		}));
	}

	this.add = function(p) {
		execute({
			command: "add",
			arguments: (function() {
				var rv = [];
				if (p.path) {
					rv.push(p.path);
				}
				if (p.paths) {
					rv.push.apply(rv,p.paths);
				}
				return rv;
			})()
		});
	};

	this.commit = function(p) {
		execute({
			command: "commit",
			arguments: (function() {
				if (!p.message) {
					throw new TypeError("Required: message property containing commit message");
				}
				var rv = ["-m", p.message];
				if (p.author) {
					rv.push("--author=" + p.author);
				}
				if (p.all) {
					rv.push("-a");
				}
				return rv;
			})()
		});
	};

	this.merge = function(p) {
		var args = [];
		args.push(p.name);
		execute(jsh.js.Object.set({
			command: "merge",
			arguments: args
		}, (p.stdio) ? { stdio: p.stdio } : {}));
	}

	this.log = function(p) {
		return execute({
			command: "log",
			arguments: (function() {
				var rv = [];
				rv.push("--format=format:%H~~%cn~~%s~~%ct~~%an");
				if (p && p.since && p.until) {
					rv.push(p.since+".."+p.until);
					rv.push("--");
				} else if (p && p.since || p && p.until) {
					throw new TypeError("Unsupported: since or until without other");
				}
				if (p && p.author) {
					rv.push("--author=" + p.author);
				}
				if (p && p.all) {
					rv.push("--all");
				}
				return rv;
			})()
			,stdio: {
				output: String
			}
			,evaluate: function(result) {
				if (result.status != 0) {
					return null;
				}
				return result.stdio.output.split("\n").map(function(line) {
					if (line.length == 0) return null;
					var tokens = line.split("~~");
					return {
						commit: {
							hash: tokens[0]
						},
						author: {
							name: tokens[4]
						},
						committer: {
							name: tokens[1],
							date: new jsh.time.When({ unix: Number(tokens[3])*1000 })
						},
						subject: tokens[2]
					}
				}).filter(function(commit) {
					return Boolean(commit && commit.subject);
				});
			}
		});
	};

	this.show = function(p) {
		return execute({
			command: "show",
			arguments: ["--format=%H"],
			stdio: {
				output: String,
				error: String
			}
			,evaluate: function(result) {
				if (result.status == 128) return null;
				if (result.status) {
					throw new Error(result.stdio.error);
				}
				return result.stdio.output;
			}
		});
	};

	this.status = function(p) {
		//	TODO	dependency on jsh
		return execute({
			command: "status",
			arguments: ["-s"],
			stdio: {
				output: String
			},
			evaluate: function(result) {
				var parser = /(\S+) (\S+)/;
				var rv = {};
				result.stdio.output.split("\n").forEach(function(line) {
					if (parser.exec(line)) {
						var match = parser.exec(line);
						rv[match[2]] = match[1];
					}
				});
				return rv;
			}
		});
	};

	this.fetch = function(p) {
		var args = [];
		if (p && p.all) {
			args.push("--all");
		}
		execute({
			command: "fetch",
			arguments: args,
			stdio: {
				output: String
			}
		});
	};

	this.checkout = function(p) {
		var args = [];
		args.push(p.branch);
		execute(jsh.js.Object.set({
			command: "checkout",
			arguments: args
		}, (p.stdio) ? { stdio: p.stdio } : {}));
	};

	this.branch = function(p) {
		var args = [];
		if (p && p.force) {
			args.push("-f");
		}
		if (p && p.name) args.push(p.name);
		if (p && p.start) args.push(p.start);
		if (p && p.all) {
			args.push("-a");
		}
		var output = !Boolean(p.name);
		return execute({
			command: "branch",
			arguments: args,
			stdio: {
				output: (output) ? String : (function() {})()
			},
			evaluate: function(result) {
				if (output) {
					return result.stdio.output.split("\n").map(function(line) {
						var rv = {};
						if (line.indexOf("->") != -1) {
							//	TODO	better parsing
							//	See http://stackoverflow.com/questions/12613793/why-is-there-a-remotes-origin-head-origin-master-entry-in-my-git-branch-l
							rv.line = line;
						} else {
							rv.name = line.substring(2);
						}
						return rv;
					});
				} else {
					return (function(){})();
				}
			}
		});
	};

	this.push = function(p) {
		var args = [];
		if (p && p.repository) args.push(p.repository);
		if (p && p.refspec) args.push(p.refspec);
		if (true) {
			execute({
				command: "push",
				arguments: args
			});
		} else {
			jsh.shell.echo("git push " + args.join(" "));
		}
	}
}

$exports.Repository = function(p) {
	if (p.local) {
		return new LocalRepository(p);
	} else if (p.remote) {
		return new RemoteRepository(p);
	} else {
		throw new TypeError("Required: .local or .remote property.");
	}
};