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
	 * @param { slime.loader.Export<slime.jrunscript.tools.git.internal.commands.Exports> } $export
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
				var parser = /(..) (\S+)/;
				var rv = {
					branch: void(0)
				};
				output.split("\n").forEach(function(line) {
					if (line.substring(0,2) == "##") {
						var branchName = line.substring(3);
						if (branchName.indexOf("...") != -1) {
							branchName = branchName.substring(0,branchName.indexOf("..."));
						}
						var detached = Boolean(branchName == "HEAD (no branch)")
						rv.branch = (detached) ? null : branchName;
					} else {
						var match = parser.exec(line);
						if (match) {
							if (!rv.paths) rv.paths = {};
							rv.paths[match[2]] = match[1];
						} else if (line == "") {
							//	do nothing
						} else {
							throw new Error("Unexpected line: [" + line + "]");
						}
					}
				});
				return rv;
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

		/** @type { slime.jrunscript.tools.git.Commands["submodule"] } */
		var submodule = {
			update: {
				invocation: function() {
					return {
						command: "submodule",
						arguments: ["update", "--init", "--recursive"]
					}
				}
			}
		};

		$export({
			status: status,
			fetch: fetch,
			merge: merge,
			submodule: submodule
		})
	}
//@ts-ignore
)($api,$context,$export);
