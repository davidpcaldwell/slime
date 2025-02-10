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
	 * @param { slime.jrunscript.tools.git.internal.commands.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.git.Commands> } $export
	 */
	function($api,$context,$export) {
		/**
		 * @type { slime.jrunscript.tools.git.Exports["commands"]["status"] }
		 */
		var status = {
			invocation: function() {
				return {
					command: "status",
					arguments: [
						"--porcelain", "-b"
					]
				}
			},
			result: function(output) {
				//	TODO	This ignores renamed files; see git help status
				/**
				 * @type { slime.jrunscript.tools.git.command.status.Result }
				 */
				var rv = {
					branch: void(0),
					entries: [],
					paths: void(0)
				};
				output.split("\n").forEach(function(line) {
					var NO_COMMITS_PREFIX = "## No commits yet on ";
					if ($api.fp.string.startsWith(NO_COMMITS_PREFIX)(line)) {
						rv.branch = line.substring(NO_COMMITS_PREFIX.length);
					} else if (line.substring(0,2) == "##") {
						var branchName = line.substring(3);
						if (branchName.indexOf("...") != -1) {
							branchName = branchName.substring(0,branchName.indexOf("..."));
						}
						var detached = Boolean(branchName == "HEAD (no branch)")
						rv.branch = (detached) ? null : branchName;
					} else {
						var parser = /(..) (\S+)(?: -> (\S+))?/;
						var match = parser.exec(line);
						if (match) {
							if (match[3]) {
								rv.entries.push({
									code: match[1],
									path: match[3],
									orig_path: match[2]
								});
							} else {
								rv.entries.push({
									code: match[1],
									path: match[2]
								});
							}
						} else if (line == "") {
							//	do nothing
						} else {
							throw new Error("Unexpected line: [" + line + "]");
						}
					}
				});
				rv.paths = rv.entries.reduce(function(rv,entry) {
					if (typeof(rv) == "undefined") {
						rv = {};
					}
					rv[entry.path] = entry.code;
					return rv;
				}, rv.paths);
				return rv;
			}
		}

		/** @type { slime.jrunscript.tools.git.Commands["log"] } */
		var log = {
			invocation: function(p) {
				return {
					command: "log",
					arguments: $api.Array.build(function(rv) {
						rv.push($context.log.format.argument);
						rv.push(p.revisionRange);
					})
				}
			},
			result: function(output) {
				return output.split("\n").map(function(line) {
					if (line.length == 0) return null;
					return $context.log.format.parse(line);
				}).filter(function(commit) {
					return Boolean(commit && commit.subject);
				})
			}
		}

		/** @type { slime.jrunscript.tools.git.Command<{ name: string }, void> } */
		var merge = {
			invocation: function(p) {
				return {
					command: "merge",
					arguments: $api.Array.build(function(rv) {
						rv.push(p.name);
					})
				}
			}
		}

		/**
		 * @type { slime.jrunscript.tools.git.Exports["commands"]["fetch"] }
		 */
		var fetch = {
			invocation: function() {
				return {
					command: "fetch"
				}
			}
		}

		/** @type { slime.jrunscript.tools.git.Commands["submodule"] } */
		var submodule = {
			status: {
				invocation: function(p) {
					return {
						command: "submodule",
						arguments: $api.Array.build(function(rv) {
							rv.push("status");
							if (p.cached) rv.push("--cached");
							if (p.recursive) rv.push("--recursive");
						})
					};
				},
				result: function(output) {
					return output.split("\n").slice(0,-1).map(function(line) {
						//	TODO	state is currently ignored, pending definition of a good type to hold it, but it is documented
						//			https://git-scm.com/docs/git-submodule
						//
						//			This implementation relies on the undocumented fact that the first character of the output is
						//			a space if none of the state characters (-, +, U) is specified.
						var state = line.substring(0,1);
						var tokens = line.substring(1).split(/\s/);
						return {
							sha1: tokens[0],
							path: tokens[1]
						}
					});
				}
			},
			update: {
				invocation: function() {
					return {
						command: "submodule",
						arguments: ["update", "--init", "--recursive"]
					}
				}
			}
		};

		/**
		 * @type { slime.jrunscript.tools.git.Command<string,{ head: string }> }
		 */
		var remoteShow = {
			invocation: function(name) {
				return {
					command: "remote",
					arguments: ["show", name]
				};
			},
			result: function(output) {
				var lines = output.split("\n");
				var parser = /HEAD branch\: (.*)/;
				var branch = parser.exec(lines[3])[1];
				return {
					head: branch
				}
			}
		};

		var lsFiles = {
			invocation: function(p) {
				return {
					command: "ls-files",
					arguments: $api.Array.build(function(rv) {
						if (p.recurseSubmodules) rv.push("--recurse-submodules");
					})
				};
			},
			result: function(output) {
				//	TODO	platform line ending or \n?
				return output.split("\n").filter(function(path) {
					return path.length > 0;
				});
			}
		};

		$export({
			status: status,
			merge: merge,
			log: log,
			fetch: fetch,
			submodule: submodule,
			remote: {
				show: remoteShow
			},
			lsFiles: lsFiles
		})
	}
//@ts-ignore
)($api,$context,$export);
