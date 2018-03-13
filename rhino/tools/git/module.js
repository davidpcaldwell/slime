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

//	TODO	eliminate dependency on jsh

var Installation = function(environment) {
	var git = function(m) {
		return $context.api.shell.run(
			$context.api.js.Object.set({}, m, {
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
				environment: $context.api.js.Object.set({}, $context.api.shell.environment, environment)
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
			return $context.api.shell.run($context.api.js.Object.set({}, p, {
				command: environment.program,
				arguments: [p.command].concat( (p.arguments) ? p.arguments : [] ),
				environment: $context.api.js.Object.set({}, $context.api.shell.environment, (o && o.environment) ? o.environment : {}, (p.environment) ? p.environment : {}),
				directory: directory
			}));
		};

		var formats = {
			log: {
				format: "%H~~%cn~~%s~~%ct~~%an~~%D",
				parse: function(line) {
					var tokens = line.split("~~");
					if (typeof(tokens[5]) == "undefined") throw new Error("No tokens[5]: [" + line + "]");
					var refs = (function(string) {
						var rv = {};
						if (string.length == 0) return rv;
						var tokens = string.split(", ");
						tokens.forEach(function(token) {
							var t = token.split(" -> ");
							if (t.length > 1) {
								if (!rv.names) rv.names = [];
								rv.names.push(t[1]);
							} else {
								if (!rv.names) rv.names = [];
								rv.names.push(t[0]);
							}
						});
						return rv;
					})(tokens[5]);
					return {
						names: refs.names,
						commit: {
							hash: tokens[0]
						},
						author: {
							name: tokens[4]
						},
						committer: {
							name: tokens[1],
							date: ($context.api.time) ? new $context.api.time.When({ unix: Number(tokens[3])*1000 }) : Number(tokens[3])*1000
						},
						subject: tokens[2]
					}
				}
			}
		};

		var show = function(p) {
			return execute({
				command: "show",
				//	Some sources say to use undocumented --quiet: see https://stackoverflow.com/questions/1828252/how-to-display-metainformation-about-single-commit-in-git
				arguments: (function(rv) {
					rv.push("-s");
					rv.push("--format=format:" + formats.log.format);
					if (p.object) rv.push(p.object, "--");
					return rv;
				})([]),
				stdio: {
					output: String,
					error: String
				}
				,evaluate: function(result) {
					if (result.status == 128) return null;
					if (result.status) {
						throw new Error(result.stdio.error);
					}
					return formats.log.parse(result.stdio.output.split("\n")[0]);
				}
			});
		};

		this.status = function(p) {
			var self = this;

			return execute({
				command: "status",
				arguments: ["--porcelain", "-b"],
				stdio: {
					output: String
				},
				evaluate: function(result) {
					//	TODO	This ignores renamed files; see git help status
					var parser = /(..) (\S+)/;
					var rv = {};
					result.stdio.output.split("\n").forEach(function(line) {
						if (line.substring(0,2) == "##") {
							var branchName = line.substring(3);
							if (branchName.indexOf("...") != -1) {
								branchName = branchName.substring(0,branchName.indexOf("..."));
							}
							rv.branch = { name: branchName };
							$context.api.js.Object.set(rv, self.show({ object: branchName }));
						} else {
							var match = parser.exec(line);
							if (match) {
								if (!rv.paths) rv.paths = {};
								rv.paths[match[2]] = match[1];
							} else if (line == "") {
							} else {
								throw new Error("Unexpected line: [" + line + "]");
							}
						}
					});
					return rv;
				}
			});
		};

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
			execute($context.api.js.Object.set({
				command: "merge",
				arguments: args
			}, (p.stdio) ? { stdio: p.stdio } : {}));
		};

		this.log = function(p) {
			return execute({
				command: "log",
				arguments: (function() {
					var rv = [];
					rv.push("--format=format:" + formats.log.format);
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
						return formats.log.parse(line);
					}).filter(function(commit) {
						return Boolean(commit && commit.subject);
					});
				}
			});
		};

		this.show = function(p) {
			if (!p) p = {};
			return show(p);
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
			execute($context.api.js.Object.set({
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
							if (line.indexOf("->") != -1) {
								//	TODO	better parsing
								//	See http://stackoverflow.com/questions/12613793/why-is-there-a-remotes-origin-head-origin-master-entry-in-my-git-branch-l
								return { line: line };
							} else if (line) {
								var detachedMatcher = /\(.*?\)(?:\s+)(\S+)(?:\s+)(?:.*)/;
								var match = detachedMatcher.exec(line.substring(2));
								var branchMatcher = /^(\S+)(?:\s+)(\S+)(?:\s+)(?:.*)$/;
								var current = (line.substring(0,1) == "*");
								if (p.old) {
									if (match) return {
										current: current,
										commit: {
											hash: match[1]
										}
									};
									var branchMatcher = /^(\S+)(?:\s+)(\S+)(?:\s+)(?:.*)$/;
									match = branchMatcher.exec(line.substring(2));
									if (!match) throw new Error("Does not match " + detachedMatcher + " or " + branchMatcher + ": " + line.substring(2));
									return {
										current: (line.substring(0,1) == "*"),
										name: (match[1].substring(0,1) == "(") ? null : match[1],
										commit: {
											hash: match[2]
										}
									}
								} else {
									var dMatch = detachedMatcher.exec(line);
									if (dMatch) return $context.api.js.Object.set({}, { branch: { current: true } }, show({ object: match[1] }));
									var bMatch = branchMatcher.exec(line.substring(2));
									//	TODO	starting to think we need a Branch object
									if (!bMatch) throw new Error("Does not match: [" + line + "]");
									if (String(bMatch[1]) == "undefined") throw new Error("Line: [" + line + "]");
									return $context.api.js.Object.set({}, { name: bMatch[1] }, show({ object: bMatch[1] }));
								}
							}
							return {};
						});
						//	Remove "remotes/origin/HEAD -> origin/master"
						rv = rv.filter(function(branch) {
							return !branch.line;
						});
						if (p.old && !p.all) {
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
			execute({
				command: "push",
				arguments: args,
				environment: p.environment
			});
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
						return show({ object: rv });
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

	this.Repository = function(p) {
		if (p.local || p.directory) {
			return new LocalRepository(p);
		} else if (p.remote) {
			return new RemoteRepository(p);
		} else {
			throw new TypeError("Required: .local or .remote property.");
		}
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

$exports.Installation = function(p) {
	return new Installation(p);
}

$exports.credentialHelper = {};

var program = (function() {
	var find = function(api) {
		var directoryExists = function(path) {
			return $context.api.file.Pathname(path).directory;
		}
		
		var rv = $context.api.shell.PATH.getCommand("git");
		if ($context.api.shell.os.name == "Mac OS X" && !directoryExists("/Applications/Xcode.app") && !directoryExists("/Library/Developer/CommandLineTools")) {
			rv = null;
		}
		return rv;
	};
	
	if ($context.program) return $context.program;
	return find();
})();

if (program) {
	var installation = new Installation({
		program: program
	});
	
	$exports.installation = installation;

	$exports.Repository = function(p) {
		return installation.Repository(p);
	};

	$exports.init = function(p) {
		return installation.init(p);
	};		
}

var GUI = $context.api.Error.Type("Please execute the graphical installer.");

$exports.install = $context.api.Events.Function(function(p,events) {
	var console = function(message) {
		events.fire("console", message);
	};
	if (!$exports.installation) {
		if ($context.api.shell.os.name == "Mac OS X") {
			console("Detected OS X " + $context.api.shell.os.version);
			console("Install Apple's command line developer tools.");
			$context.api.shell.run({
				command: "/usr/bin/git",
				evaluate: function(result) {
					//	Do nothing; exit status will be 1
					throw new GUI();
				}
			});
		} else if ($context.api.shell.os.name == "Linux") {
			console("Installing git using apt ...");
			if ($context.api.shell.PATH.getCommand("apt")) {
				$context.api.shell.run({
					command: "sudo",
					arguments: [
						"apt", "install", "git", "-y"
					]
				})
			} else {
				throw new Error("Unimplemented: installation of Git for Linux system without 'apt'.");
			}
		} else {
			throw new Error("Unimplemented: installation of Git for non-OS X, non-Linux system.");
		}
	} else {
		console("Git already installed.");
	}
});
$exports.install.GUI = GUI;
