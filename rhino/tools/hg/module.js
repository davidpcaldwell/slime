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

var toNativePath = function(pathname) {
	if ($context.api.file.filesystems.cygwin) {
		return $context.api.file.filesystems.cygwin.toWindows(pathname).toString();
	} else {
		return pathname.toString();
	}
}

var parseLog = function(lines) {
	var parser = /^([a-z]+)\:(?:\s*)(.*)$/;
	var rv = [];
	var changeset;
	lines.forEach( function(line) {
		if (line == "") {
			changeset = null;
			return;
		}
		var parsed = parser.exec(line);
		if (!parsed) throw "Not parsable: [" + line + "]";
		if (!changeset) {
			changeset = {};
			rv.push(changeset);
		}

		var name = parsed[1];
		var value = parsed[2];

		var canHaveMultipleWithThisName = (name == "parent" || name == "bookmark");

		//	TODO	parse the dates

		if (name == "changeset") {
			var tokens = value.split(":");
			changeset[name] = { local: Number(tokens[0]), global: tokens[1] };
		} else if (name == "date" && $context.api.time) {
			var tokens = value.split(" ");
			var months = {
				Jan: "01",
				Feb: "02",
				Mar: "03",
				Apr: "04",
				May: "05",
				Jun: "06",
				Jul: "07",
				Aug: "08",
				Sep: "09",
				Oct: "10",
				Nov: "11",
				Dec: "12"
			}
			var rfc3339 = tokens[4] + "-" + months[tokens[1]] + "-" + tokens[2] + "T" + tokens[3] + tokens[5].substring(0,3) + ":" + tokens[5].substring(3,5);
			var when = $context.api.time.When.codec.rfc3339.decode(rfc3339);
			changeset[name] = new Date(when.unix);
		} else if (canHaveMultipleWithThisName) {
			if (!changeset[name]) changeset[name] = [];
			changeset[name].push(value);
		} else {
			if (changeset[name]) throw new Error("Duplicate values for " + name + ": " + changeset[name] + " and " + value);
			changeset[name] = value;
		}
	});
	return rv;
};

var Installation = function(environment) {
	var shell = function(p) {
		var invocation = {};

		var args = [];

		if (p.verbose) {
			args.push("-v");
		}

		if (p.debug) {
			args.push("--debug");
		}

		if (p.config) {
			for (var x in p.config) {
				args.push("--config", x + "=" + p.config[x]);
			}
		}
		if (p.repository) {
			args.push("-R", p.repository.reference);
			if (p.repository.config) {
				for (var x in p.repository.config) {
					args.push("--config", x + "=" + p.repository.config[x]);
				}
			}
		}
		args.push(p.command);
		args.push.apply(args,p.arguments);

		if (p.directory) {
			invocation.directory = p.directory;
		}

		if (p.evaluate) {
			if (p.stdio) {
				invocation.stdio = p.stdio;
				invocation.evaluate = p.evaluate;
			} else {
				invocation.stdio = {
					output: String,
					error: String
				}
				//	TODO	get rid of out/err below and reference now-standard rhino/shell result.stdio in callers
				invocation.evaluate = function(result) {
					var myresult = $context.api.js.Object.set({}, result, (result.stdio) ? {
						out: result.stdio.output,
						err: result.stdio.error
					} : {});
					return p.evaluate(myresult);
				}
			}
		} else if (p.stdio) {
			invocation.stdio = p.stdio;
			invocation.evaluate = function(result) {
				//	TODO	should standard rhino/shell behave this way?
				if (result.status != 0) {
					var error = new Error("Exit status " + result.status + " from " + result.command + " " + result.arguments.join(" "));
					error.stdio = result.stdio;
					throw error;
				} else {
					return result;
				}
			}
		}

		if (environment.install && $context.api.shell.os.name == "Linux") {
			var shebang = environment.install.read(String).split("\n")[0];
			var parsed = /\#\!(?:\s*)(\S+)(?:\s*)$/.exec(shebang);
			invocation.command = parsed[1];
			args.unshift(environment.install.toString());
			invocation.arguments = args;
			debugger;
		} else {
			invocation.command = environment.install;
			invocation.arguments = args;
		}

		if (p.on) {
			invocation.on = p.on;
		}

		//Packages.java.lang.System.err.println("Shelling " + invocation.command + " " + invocation.arguments.join(" "));
		return $context.api.shell.run(invocation);
	};

	var rv = {};

	var Repository = function() {
		//	reference property defined by implementations
		this.on = {};

		this.clone = function(p) {
			if (this.on.access) this.on.access.call(this);
			var todir = (function(p) {
				if (p.directory === true && p.pathname) return p;
				if (p.createDirectory) {
					return p.createDirectory({
						exists: function(dir) {
							return false;
						}
					});
				}
				if (p.to) return arguments.callee(p.to);
				throw new TypeError("Argument must be directory or pathname")
			})(p);
			//Packages.java.lang.System.err.println("verbose " + Boolean(p && p.verbose));
			//Packages.java.lang.System.err.println("debug " + Boolean(p && p.debug));
			return shell({
				command: "clone",
				arguments: [this.reference, todir.toString()],
				config: (p && p.config) ? p.config : {},
				debug: (p && p.debug),
				verbose: (p && p.verbose),
				stdio: (p && p.stdio) ? p.stdio : void(0),
				evaluate: function(result) {
					//Packages.java.lang.System.err.println("result = " + result);
					//Packages.java.lang.System.err.println("result.status = " + result.status);
					if (result.status != 0) {
						//	TODO	develop test for clone error and then switch this to use newer API
						throw new Error("err=" + result.err + "\n" + "out=" + result.out + "\n" + "args=" + result.arguments.join(","));
					}
					var rv = new LocalRepository(todir);
					//	Manually emulate hg 2.4+ behavior of updating to the @ bookmark. Should be merely redundant if hg client
					//	is version 2.4+. Could, I suppose, check to see whether revision is the same as bookmark before update command
					var bookmarks = rv.bookmarks();
					var magic = $context.api.js.Array.choose(bookmarks, $context.api.js.Filter.property("name", $context.api.js.Filter.equals("@")));
					if (magic && !p.update) {
						rv.update({
							revision: magic.changeset.global
						});
					}
					return rv;
				}
			});
		};
	};

	var RemoteRepository = function(url) {
		Repository.call(this);
		this.reference = url;

		this.url = $context.api.web.Url.parse(url);

		this.toString = function() {
			return "hg repository: " + url;
		};
	};

	var LocalRepository = function Recurse(dir) {
		if (dir == null) throw new RangeError("Attempt to create Repository with null dir");
		if (!dir.getSubdirectory) throw new TypeError("dir " + dir + " must be a directory");
		if (!dir.getSubdirectory(".hg")) throw new RangeError("No repository located at: " + dir);

		Repository.call(this);

		this.toString = function() {
			return "hg repository: " + dir.pathname.toString();
		}

		this.reference = toNativePath(dir.pathname);

		this.__defineGetter__("directory", function() {
			return dir;
		});

		$context.api.js.lazy(this,"paths",function() {
			return shell({
				repository: this,
				command: "paths",
				evaluate: function(result) {
					var rv = {};
					var parser = /^(\w+)(?:\s*)\=(?:\s*)(.*)$/;
					var lines = result.out.split("\n");
					lines.forEach( function(line) {
						if (line != "") {
							var parsed = parser.exec(line);

							var pathnameToRepository = function(pathname) {
								if (pathname.directory && pathname.directory.getSubdirectory(".hg")) {
									return new LocalRepository(pathname.directory);
								} else {
									//	TODO	should
									var error = new TypeError("Does not appear to be a local repository location: " + pathname);
									error.location = pathname.toString();
									throw error;
								}
							};

							if (
								new RegExp("^http(s?)://").test(parsed[2])
								|| new RegExp("^ssh://").test(parsed[2])
							) {
								rv[parsed[1]] = new RemoteRepository(parsed[2]);
							} else if (new RegExp("^file://").test(parsed[2])) {
								var _file = new Packages.java.io.File(new Packages.java.net.URI(parsed[2]));
								//	the rhino/file module may have a better way to convert a java.io.File to a pathname
								var pathname = $context.api.file.filesystems.os.Pathname(String(_file.getPath()));
								rv[parsed[1]] = pathnameToRepository(pathname);
							} else {
								//	Hmmm ... may need this for unresolved references
								var pathname = $context.api.file.filesystems.os.Pathname(parsed[2]);
								if ($context.api.file.filesystems.cygwin) {
									try {
										pathname = $context.api.file.filesystems.cygwin.toUnix(pathname);
									} catch (e) {
										//	TODO	emit a log message? Only known case currently is when "device is not ready"
									}
								}
								rv[parsed[1]] = pathnameToRepository(pathname);
							}
						}
					});
					return rv;
				}
			});
		});

		var inout = (function(target) {
			return function(verb,m) {
				var self = this;
				var MyErrorType = $context.api.js.Error.Type("HgError");
				var MyError = function(p) {
					var rv = new MyErrorType();
					jsh.js.Object.set(rv,p);
					return rv;
				}

				var parse = function(result) {
					if (result.err == "abort: repository is unrelated\n") {
						throw new MyError({ message: "Unrelated: " + targetargs + " (to " + target + ")", unrelated: true });
					} else if (result.status != 0) {
						if (/^abort\: repository (.*) not found\!\n$/.test(result.err)) {
							throw new MyError({ message: "Not found", notFound: true });
						}
					}
					return {
						status: result.status,
						err: result.err,
						lines: result.out.split("\n")
					};
				};

				var targetargs = (function() {
					if (!m) return [];
					var other;
					if (verb == "incoming") other = m.source;
					if (verb == "outgoing") other = m.destination;
					return (other) ? [other.reference] : [];
				})();

				var config = (m && m.config) ? m.config : {};

				if (m && m.revision) {
					targetargs.push("-r", m.revision);
				}

				return shell({
					repository: target,
					command: verb,
					arguments: targetargs,
					config: config,
					evaluate: function(result) {
						var parsed = parse(result);
						if ( (parsed.lines[1] == "no changes found" || parsed.lines[2] == "no changes found") && parsed.status == 1) {
							return [];
						} else if (/abort\: http authorization/.test(parsed.err)) {
							var other = (targetargs[0]) ? targetargs[0] : target.paths["default"].reference;
							var e = new Error("HTTP authorization required for " + other);
							e.unauthorized = true;
							throw e;
						} else {
							if (parsed.err && parsed.err.split("\n")[0] == "abort: error: nodename nor servname provided, or not known") {
								var e = new Error("Unable to use DNS to identify repository server");
								e.unreachable = true;
								throw e;
							}
							if (!/^comparing with /.test(parsed.lines[0])) throw new Error("Wrong line 0: " + parsed.lines[0]);
							//	TODO	probably need to review this with some test cases: what is status when no changes found?
							if (parsed.status != 0) {
								throw new Error("Status: " + parsed.status + " err:\n" + parsed.err);
							}
							if (parsed.lines[1] != "searching for changes" && parsed.lines[1] != "no changes found") {
								var log = target.log();
								if (log.length) {
									throw new Error("Wrong line 1: " + parsed.lines[1] + "\nLines:\n" + parsed.lines.join("\n"));
								} else {
									//	if this is at changeset 0, for some reason the above output line is omitted
									//	TODO	probably need to splice it out; need test case
								}
							}
							//	TODO	this may or may not work, depending on variations in output
							return parseLog(parsed.lines.slice(2));
						}
					}
				});
			};
		})(this);

		this.outgoing = function(m) {
			return inout("outgoing",m);
		}

		this.incoming = function(m) {
			return inout("incoming",m);
		}

		this.push = function(p) {
			var destination = (p && p.destination) ? p.destination : null;
			//	TODO	should fall back to default and/or default-push to call on.access
			if (destination && destination.on.access) {
				destination.on.access.call(destination);
			}
			var args = [];
			if (p && p.force) {
				args.push("-f");
			}
			if (p && p.revision) {
				args.push("-r", p.revision);
			}
			if (p && p.destination) {
				args.push(p.destination.reference);
			}
			return shell({
				repository: this,
				config: (p && p.config) ? p.config : {},
				stdio: (p && p.stdio) ? p.stdio : void(0),
				command: "push",
				arguments: args
			});
		};

		this.pull = function(p) {
			var source = (p && p.source) ? p.source : null;
			//	TODO	should fall back to default and/or default-push to call on.access
			if (source && source.on.access) {
				source.on.access.call(source);
			}
			var args = [];
			if (p && p.source) {
				args.push(p.source.reference);
			}
			if (p && p.force) {
				args.push("-f");
			}
			return shell({
				repository: this,
				config: (p && p.config) ? p.config : {},
				stdio: (p && p.stdio) ? p.stdio : void(0),
				command: "pull",
				arguments: args
			});
		}

		this.log = function(p) {
			var args = [];
			if (p && p.revision) {
				args.push("-r", p.revision);
			}
			return shell({
				repository: this,
				command: "log",
				arguments: args,
				evaluate: function(result) {
					return parseLog(result.stdio.output.split("\n"));
				}
			});
		};

		this.heads = function() {
			return shell({
				repository: this,
				command: "heads",
				evaluate: function(result) {
					return parseLog(result.stdio.output.split("\n"));
				}
			});
		};

		this.tip = function() {
			return shell({
				repository: this,
				command: "tip",
				evaluate: function(result) {
					return parseLog(result.stdio.output.split("\n"))[0];
				}
			});
		};

		this.identify = function(p) {
			if (this.on.access) this.on.access.call(this);
			//	TODO	hg help identify claims there is a way that this can include two parent identifiers, but cannot so far reproduce
			//			that
			var local = Boolean(this.directory);
			var rv = shell({
				command: "identify",
				arguments: ((local) ? ["-ni"] : []).concat([this.reference]),
				evaluate: function(result) {
					var output = result.out.split("\n").slice(0,-1)[0];
					if (local) {
						var match = /([0-9a-f]+)(\+?)\s+(\-?[0-9]+)(\+?)/.exec(output);
						if (!match) {
							throw new Error("No match for: [" + output + "]");
						}
						return {
							changeset: {
								global: match[1],
								local: Number(match[3])
							},
							modified: Boolean(match[2])
						};
					} else {
						return { changeset: { global: output } };
					}
				}
			});
			return rv;
		};

		this.parents = function() {
			return shell({
				repository: this,
				command: "parents",
				evaluate: function(result) {
					return parseLog(result.stdio.output.split("\n"));
				}
			});
		}

		this.archive = function(p) {
			var args = [];
			if (p.exclude) {
				if (p.exclude.forEach) {
					p.exclude.forEach(function(exclude) {
						args.push("--exclude",exclude);
					})
				} else {
					//	TODO	verify this is a string
					args.push("--exclude",p.exclude);
				}
			}
			args.push(String(p.destination));
			return shell({
				repository: this,
				command: "archive",
				arguments: args
			});
		};

		this.subrepositories = function(p) {
			if (!p) p = {};
			var file = dir.getFile(".hgsub");
			//	TODO	or empty array?
			if (!file) return null;
			var hgsub = new $exports.Hgrc({ file: file/*, section: "" */ });
			var list = hgsub.get();

			var hgsubstate = {};
			if (dir.getFile(".hgsubstate")) {
				dir.getFile(".hgsubstate").read(String).split("\n").forEach(function(line) {
					var tokens = line.split(" ");
					hgsubstate[tokens[1]] = tokens[0];
				});
			}

			var rv = (p.array) ? [] : {};
			for (var x in list) {
				if (/^subpaths\./.test(x)) {
				} else {
					var sub = dir.getSubdirectory(list[x]);
					var repository = (sub) ? new Recurse(sub) : null;
					if (p.array) {
						if (!repository) throw new Error("No subdirectory " + x + " entries=" + JSON.stringify(list));
						rv.push(repository);
					} else {
						rv[list[x]] = {
							repository: repository,
							revision: hgsubstate[x]
						}
					}
				}
			}
			return rv;
		};

		this.getSubrepositories = $api.deprecate(this.subrepositories);

		this.status = function(p) {
			var subrepositories = (function(dir,p) {
				if (p && p.subrepos === true) return true;
				if (p && p.subrepos === false) return false;
				return Boolean(dir.getFile(".hgsub"));
			})(dir,p);
			var args = [];
			if (subrepositories) {
				args.push("-S");
			}
			return shell({
				repository: this,
				command: "status",
				arguments: args,
				evaluate: function(result) {
					var lines = result.out.split("\n").slice(0,-1);
					var rv = {};
					lines.forEach( function(line) {
						rv[line.substring(2).replace(/\\/g, "/")] = line.substring(0,1);
					});
					return rv;
				}
			});
		};

		this.add = function(p) {
			var args = [];
			if (p.files) {
				args.push.apply(args,p.files);
			}
			return shell({
				repository: this,
				command: "add",
				arguments: args
			});
		}

		this.update = function(p) {
			var args = [];
			if (p && p.revision) {
				args.push(p.revision);
			}
			return shell({
				repository: this,
				command: "update",
				arguments: args
			});
		};

		this.merge = function(p) {
			var args = [];
			if (p && p.revision) {
				args.push("-r", p.revision);
			}
			return shell({
				repository: this,
				arguments: args,
				command: "merge"
			});
		}

		this.commit = function(p) {
			if (typeof(p) == "undefined") throw new TypeError("Required: argument to commit.");
			if (p === null) throw new TypeError("Required: non-null argument to commit.");
			if (typeof(p) != "object") throw new TypeError("Required: object argument to commit.");
			if (!p.message) throw new TypeError("Required: message property representing commit message.");
			var args = [];
			for (var x in p) {
				if (x == "addremove") {
					args.push("--addremove");
				} else if (x == "message") {
					args.push("--message",p[x]);
				}
			};
			if (p.files) {
				args.push.apply(args,p.files);
			}
			return shell({
				repository: this,
				command: "commit",
				arguments: args
			});
		};

		this.bookmarks = function(p) {
			if (p && p.name) {
				if (p.delete) {
					return shell({
						repository: this,
						command: "bookmarks",
						arguments: ["-d", p.name]
					});
				} else {
					var revision = (p.revision) ? ["-r", p.revision] : [];
					return shell({
						repository: this,
						command: "bookmarks",
						arguments: ((p.force) ? ["--force"] : []).concat((p.inactive) ? ["--inactive"] : []).concat(revision).concat([p.name])
					});
				}
			} else if (p && p.name === null) {
				var active = $context.api.js.Array.choose(this.bookmarks(), function(bookmark) {
					return bookmark.active;
				});
				if (active) {
					return shell({
						repository: this,
						command: "bookmarks",
						arguments: ["-i", active.name]
					});
				}
			}
			return shell({
				repository: this,
				command: "bookmarks",
				evaluate: function(result) {
					var lines = result.stdio.output.split("\n");
					var matcher = /(?:(\*)\s+)?(\S+)\s+(\S+)\:(\S+)/;
					var nonblank = lines
						.filter(function(line) {
							return Boolean(line);
						})
					;
					if (nonblank.length == 1 && nonblank[0] == "no bookmarks set") return [];
					var rv = nonblank
						.map(function(line) {
							var match = matcher.exec(line);
							if (!match) throw new TypeError("No match for: [" + line + "]");
							return {
								active: Boolean(match[1]),
								name: match[2],
								changeset: {
									global: match[4],
									local: Number(match[3])
								}
							};
						})
					;
					rv.forEach(function(bookmark) {
						if (isNaN(Number(bookmark.name))) {
							rv[bookmark.name] = bookmark;
						}
					});
					return rv;
				}
			});
		};

		this.serve = function(p) {
			var lock = new $context.api.java.Thread.Monitor();
			var rv;
			var port = (function() {
				if (p.port === 0) return $context.api.ip.tcp.getEphemeralPortNumber();
				if (typeof(p.port) == "number") return p.port;
				//	TODO	perhaps default should be to check whether 8000 is open, return 8000 if so, return ephemeral if not?
				return 8000;
			})();
			var self = this;
			$context.api.java.Thread.start(function() {
				shell($context.api.js.Object.set(
					{},
					{
						repository: self,
						command: "serve",
						config: p.config,
						arguments: (function() {
							var array = [];
							array.push("-p", String(port));
							return array;
						})(),
						on: {
							start: function(process) {
								lock.Waiter({
									until: function() {
										return true;
									},
									then: function() {
										rv = process;
									}
								})()
							}
						}
					}
				));
			});
			//	TODO	probably if there is some kind of error this would just hang indefinitely and the error would not be
			//			reported anywhere
			return lock.Waiter({
				until: function() {
					return rv;
				},
				then: function() {
					rv.port = port;
					return rv;
				}
			})();
		}

		this.shell = function(p) {
			return shell($context.api.js.Object.set({}, { repository: this }, p));
		}
	};

	rv.init = function(p) {
		if (p.directory && p.pathname) {
			//	Used to allow passing directory argument
			p = $api.deprecate(function(was) {
				return {
					pathname: p.pathname
				};
			})(p);
		}
		var dir = p.pathname.createDirectory({
			exists: function(dir) {
				return false;
			},
			recursive: true
		});
		shell({
			command: "init",
			directory: dir
		});
		return new LocalRepository(dir);
	};

	rv.Repository = function(p) {
		if (typeof(p) == "object" && p) {
			if (p.local) {
				return $api.deprecate(function() {
					return new LocalRepository(p.local);
				})();
			} else if (p.url) {
				return new RemoteRepository(p.url);
			} else if (p.directory && p.directory.pathname) {
				return new LocalRepository(p.directory);
			} else {
				throw new Error("Required: local or url");
			}
		} else {
			throw new TypeError();
		}
	}

	return rv;
};

$exports.Installation = function(o) {
	return Installation(o);
}

if ($context.install) {
	var installation = Installation({
		install: $context.install
	});

	$exports.Repository = function(p) {
		return new installation.Repository(p);

		if (false) {
			this.__defineGetter__("changesets", function() {
				var rv = {};
				exec(["parents"],dir,{
					callback: function(output) {
						rv.parents = parseLog(output.split("\n"));
					}
				});
				exec(["tip"],dir,{
					callback: function(output) {
						rv.tip = parseLog(output.split("\n"))[0];
					}
				});
				return rv;
			});

			this.heads = function() {
				var lines;
				exec(["heads"],dir,{
					callback: function(output,error) {
						lines = output.split("\n");
					}
				});
				return parseLog(lines);
			}

			this.tag = function(name,mode) {
				if (!mode) mode = {};
				var command = ["tag"];
				if (mode.local) {
					command.push("-l");
				}
				if (mode.force) {
					command.push("-f");
				}
				command.push(name);
				exec(command,dir,{callback: function(output) {
				}});
			}

			this.clone = function(todir) {
				exec(["clone",toNativePath(dir.pathname),toNativePath(todir.pathname)],dir,new function() {
					var output;

					this.callback = function(out,err) {
						output = { out: out, err: err };
					}

					this.parse = function(result) {
						if (result.status != 0) {
							throw new Error(output.err + " args=" + result.arguments.join(","));
						}
					}
				});
				return new $exports.Repository(todir);
			};

			var Repository = arguments.callee;

			var toRepository = function(p) {
				if (typeof(p.heads) == "function") {
					return p;
				}
				if (typeof(p.heads) == "undefined" && typeof(p.pathname) == "object" && typeof(p.pathname.directory) == "object") {
					//	DEPRECATED: should be Repository, not directory
					debugger;
					return new Repository(p);
				}
				throw new TypeError("Not a repository: " + p);
			};

			var toRepositoryArgument = function(p) {
				var r;
				if (typeof(p) == "string") {
					//	should be remote repository
					return p;
				} else if (r = toRepository(p)) {
					return toNativePath(r.directory.pathname);
				} else {
					throw new TypeError(p);
				}
			}

			var inout = function(verb,destination,p) {
				var args = [];
				if (p && p.config) {
					for (var x in p.config) {
						args.push("--config", x + "=" + p.config[x]);
					}
				}
				args.push(verb);
				if (destination) {
					args.push(toRepositoryArgument(destination));
				}
				if (false) jsh.shell.echo("Command: " + args.join(" "));
				var result = exec(args,dir,{
					parse: function(result) {
						if (result.output.err == "abort: repository is unrelated\n") {
							throw { unrelated: true };
						} else if (result.status != 0) {
							if (/^abort\: repository (.*) not found\!\n$/.test(result.output.err)) {
								throw { notFound: true };
							}
						}
						return {
							status: result.status,
							err: result.output.err,
							lines: result.output.out.split("\n")
						};
					}
				});
				if (result.lines[2] == "no changes found" && result.status == 1) {
					return [];
				} else {
					if (!/^comparing with /.test(result.lines[0])) throw "Wrong line 0: " + result.lines[0];
					//	TODO	probably need to review this with some test cases: what is status when no changes found?
					if (result.status != 0) {
						throw new Error("Status: " + result.status + " err:\n" + result.err);
					}
					if (result.lines[1] != "searching for changes" && result.lines[1] != "no changes found") {
						throw new Error("Wrong line 1: " + result.lines[1] + "\nLines:\n" + result.lines.join("\n"));
					}
					return parseLog(result.lines.slice(2));
				}
			};

			this.outgoing = function(destination,m) {
				return inout("outgoing",destination,$context.api.js.Object.set({},p,m));
			}

			this.incoming = function(destination,m) {
				return inout("incoming",destination,$context.api.js.Object.set({},p,m));
			}

			this.pull = function(from) {
				var output;
				var args = ["pull"];
				if (from) {
					args.push(toNativePath(from.directory.pathname));
				}
				exec(args,dir,{
					callback: function(out,err) {
						output = { out: out, err: err }
					},
					onExit: function(result) {
						if (result.status != 0) {
							throw new Error("Failure: " + output.err + " arguments=" + result.arguments.join(","));
						}
					}
				});

				//	does not work under some circumstances:
				//	on pull:
				//		(run 'hg heads' to see heads, 'hg merge' to merge)
				//	on attempt to update:
				//		abort: crosses branches (use 'hg merge' or 'hg update -C')
				if (false) {
					if (this.heads().length > 1) {
						exec(["merge"],dir);
					} else {
						exec(["update"],dir);
					}
				}
			}

			this.view = function() {
				exec(["view"],dir);
			}
		}
	};

	$exports.init = function(dir) {
		return installation.init(dir);
	//	shell({
	//		command: "init",
	//		directory: dir
	//	});
	//	return new $exports.Repository({ local: dir });
	};
}

$exports.Hgrc = function(p) {
	var headerMatch = /^\[(.*)\]/;
	var valueMatch = /^(\S+)(?:\s*)\=(?:\s*)(.+)$/
	var continueMatch = /^(\s+)(.*)$/
	var lines = p.file.read(String).split("\n");

	var parse = function() {
		//	From man hgrc:
		//	Each line contains one entry. If the lines that follow are indented, they are treated as continuations of that
		//	entry. Leading whitespace is removed from values. Empty lines are skipped. Lines beginning with # or ; are ignored
		//	and may be used to provide comments

		var rv = new function() {
			this.lines = [];

			var getName = function(line) {
				return (typeof(line.section) != "undefined" && line.name) ? ((line.section) ? (line.section + ".") : line.section) + line.name : null;
			}

			this.get = function(name) {
				var single = (arguments.length > 0);
				var rv = (single) ? null : {};
				this.lines.forEach(function(line) {
					if (single && getName(line) == name) {
						rv = line.value;
					} else if (!single) {
						if (getName(line)) rv[getName(line)] = line.value;
					}
				});
				return rv;
			}
		};

		var section;
		if (typeof(p.section) != "undefined") {
			section = {
				name: p.section,
				lines: []
			}
		}
		lines.forEach(function(line) {
			var current = { line: line };
			rv.lines.push(current);
			if (false) {
			} else if (line.substring(0,1) == "#" || line.substring(0,1) == ";") {
			} else if (headerMatch.test(line)) {
				var match = headerMatch.exec(line);
				current.header = match[1];
				section = { name: match[1], lines: [] };
			} else if (valueMatch.test(line)) {
				var match = valueMatch.exec(line);
				//	TODO	what if section is undefined?
				if (!section) {
					section = {
						name: "",
						lines: []
					};
				}
				section.lines.push(current);
				current.section = section.name;
				current.name = match[1];
				current.value = match[2];
			} else if (continueMatch.test(line)) {
				throw new Error("Unimplemented: line continuation.");
			} else if (!line) {
			} else {
				//	jsh.shell.echo("No match: " + line);
			}
		});
		return rv;
	};

	this.get = function(name) {
		if (arguments.length > 0) {
			return parse().get(name)
		} else {
			return parse().get();
		}
	};

	this.set = function(section,name,value) {
		//	TODO	more intelligent implementation
		lines.push("[" + section + "]");
		lines.push(name + " = " + value);
	};

	var normalizeSections = function(parsed) {
		var section;
		var bySection = {};
		var after = [];
		parsed.lines.forEach(function(entry) {
			if (false) {
			} else if (entry.header) {
				if (section) {
					section.index = after.length;
				}
				section = {};
				if (false) {
				} else if (!bySection[entry.header]) {
					bySection[entry.header] = section;
					after.push(entry);
				} else {
					section = bySection[entry.header];
					section.append = true;
					//	repeated; do not add
				}
			} else {
				if (section && section.append) {
					after.splice(section.index,0,entry);
					section.index++;
				} else {
					after.push(entry);
				}
			}
		});
		return after.map(function(entry) {
			return entry.line;
		});
	};

	var normalizeLines = function(parsed) {
		var indexByName = {};
		var rv = [];
		parsed.lines.forEach(function(entry) {
			if (false) {
			} else if (entry.section && entry.name) {
				var key = entry.section + "." + entry.name;
				if (typeof(indexByName[key]) != "undefined") {
					rv[indexByName[key]] = entry;
				} else {
					indexByName[key] = rv.length;
					rv.push(entry);
				}
			} else {
				rv.push(entry);
			}
		});
		return rv.map(function(entry) {
			return entry.line;
		});
	}

	this.normalize = function() {
		//	Check for duplicate sections and eliminate
		lines = normalizeSections(parse());
		lines = normalizeLines(parse());
	};

	this.write = function() {
		p.file.pathname.write(lines.join("\n"), { append: false });
	};

	this.unit = {
		parse: parse
	};
	this.unit.__defineGetter__("lines", function() {
		return lines;
	});
};