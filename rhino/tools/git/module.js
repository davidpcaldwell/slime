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

var Installation = function(environment) {
	this.git = function(m) {
		return jsh.shell.run(
			jsh.js.Object.set({}, m, {
				command: environment.program,
				arguments: (function() {
					var rv = [];
					if (m.config) {
						for (var x in m.config) {
							rv.push("-c", x + "=" + m.config[x]);
						}
					}
					rv.push(m.command);
					rv.push.apply(rv, (m.arguments) ? m.arguments : []);
					return rv;
				})()
			})
		);
	};

	this.init = function(m) {
		git({
			command: "init",
			arguments: [m.pathname]
		});
		return new LocalRepository({
			directory: m.pathname.directory
		});
	}
};

var installation = new Installation({
	program: $context.program
});

var git = function(p) {
	return installation.git(p);
};

var Repository = function(o) {
	var environment = (o && o.environment) ? o.environment : {};

	this.clone = function(p) {
		if (!p.to) {
			throw new Error("Required: 'to' property indicating destination.");
		}
		git({
			config: p.config,
			command: "clone",
			arguments: [o.remote,p.to.toString()],
			environment: jsh.js.Object.set({}, jsh.shell.environment, environment)
		});
		return new LocalRepository({ local: p.to.directory });
	}
};

var RemoteRepository = function(o) {
	Repository.call(this,o);
	this.toString = function() {
		return "git remote: " + o.remote;
	}

	this.reference = o.remote;
};

var LocalRepository = function(o) {
	Repository.call(this,o);
	var directory = (function() {
		if (o.directory) return o.directory;
		if (o.local) return $api.deprecate(function() {
			return o.local;
		})();
	})();
	this.directory = directory;
	this.base = directory;
	$api.deprecate(this,"base");

	this.toString = function() {
		return "git local: " + directory;
	};

	["getRelativePath","getFile","getSubdirectory"].forEach(function(method) {
		this[method] = function() {
			return directory[method].apply(directory,arguments);
		}
	},this);

	var execute = function(p) {
		return jsh.shell.run(jsh.js.Object.set({}, p, {
			command: $context.program,
			arguments: [p.command].concat( (p.arguments) ? p.arguments : [] ),
			environment: jsh.js.Object.set({}, jsh.shell.environment, (o && o.environment) ? o.environment : {}, (p.environment) ? p.environment : {}),
			directory: directory
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
		if (p.ff_only) {
			args.push("--ff-only");
		}
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
							date: (jsh.time) ? new jsh.time.When({ unix: Number(tokens[3])*1000 }) : Number(tokens[3])*1000
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
				var parser = /(\S+)(?:\s+)(\S+)/;
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
		if (!p) p = {};
		if (p.force) {
			args.push("-f");
		}
		if (p.delete) {
			args.push("-d");
		}
		if (p.name) args.push(p.name);
		if (p.start) args.push(p.start);
		if (p.all) {
			args.push("-a");
		}
		var output = !Boolean(p.name);
		if (output) {
			args.push("-v");
		}
		return execute({
			command: "branch",
			arguments: args,
			stdio: {
				output: (output) ? String : (function() {})()
			},
			evaluate: function(result) {
				if (output) {
					var rv = result.stdio.output.split("\n").filter(function(line) { return line; }).map(function(line) {
						var rv = {};
						if (line.indexOf("->") != -1) {
							//	TODO	better parsing
							//	See http://stackoverflow.com/questions/12613793/why-is-there-a-remotes-origin-head-origin-master-entry-in-my-git-branch-l
							rv.line = line;
						} else if (line) {
							rv.current = (line.substring(0,1) == "*");
							var matcher = /^(\S+)(?:\s+)(\S+)(?:\s+)(?:.*)$/;
							var match = matcher.exec(line.substring(2));
							if (!match) throw new Error("Does not match " + matcher + ": " + line.substring(2));
							rv.name = match[1];
							rv.commit = {
								hash: match[2]
							};
						}
						return rv;
					});
					if (!p.all) {
						rv = rv.filter(function(branch) {
							return branch.current;
						})[0];
					}
					return rv;
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
				arguments: args,
				environment: p.environment
			});
		} else {
			jsh.shell.echo("git push " + args.join(" "));
		}
	};

	this.stash = function(p) {
		if (!p) p = {};
		execute({
			command: "stash"
		});
	};
	this.stash.list = (function(p) {
		if (!p) p = {};
		return execute({
			command: "stash",
			arguments: ["list"],
			stdio: {
				output: String
			},
			evaluate: function(result) {
				//	TODO	would this work on Windows?
				return result.stdio.output.split("\n").slice(0,-1).map(function(line) {
					return { line: line }
				});
			}
		});
	}).bind(this);

	this.mergeBase = function(p) {
		var args = [];
		args = args.concat(p.commits);
		return execute({
			command: "merge-base",
			arguments: args,
			stdio: {
				output: String
			},
			evaluate: function(result) {
				if (result.status == 0) {
					var rv = (/^(\S+)/.exec(result.stdio.output))[1];
					if (!rv) {
						throw new Error("No match: [" + result.stdio.output + "]");
					}
					return rv;
//					return result.stdio.output;
				} else {
					throw new Error("git exited with status " + result.status);
				}
			}
		})
	};

	this.submodule = function(p) {
		if (p.command == "update") {
			execute({
				command: "submodule",
				arguments: (function() {
					var rv = [];
					rv.push(p.command);
					if (p.init) {
						rv.push("--init");
					}
					if (p.recursive) {
						rv.push("--recursive");
					}
					return rv;
				})()
			})
		} else if (p.command == "sync") {
			execute({
				command: "submodule",
				arguments: ["sync"]
			});
		}
	}
}

$exports.Repository = function(p) {
	if (p.local || p.directory) {
		return new LocalRepository(p);
	} else if (p.remote) {
		return new RemoteRepository(p);
	} else {
		throw new TypeError("Required: .local or .remote property.");
	}
};

$exports.init = function(p) {
	return installation.init(p);
};
