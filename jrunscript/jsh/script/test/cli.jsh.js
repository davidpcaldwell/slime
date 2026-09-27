//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		var aliased = function(p) {
		};
		var merged = jsh.script.cli.defineCommand(function(p) {
		}, {
			summary: "First summary.",
			description: "Retained description.",
			options: ["--first    Retained option."]
		});
		jsh.script.cli.defineCommand(merged, {
			summary: "Second summary."
		});
		jsh.script.cli.wrap({
			commands: {
				status: jsh.script.cli.defineCommand(function(p) {
					if (p.arguments.length == 0) return 0;
					if (p.arguments.length > 1) return -1;
					return Number(p.arguments[0]);
				}, {
					summary: "Reports the requested status code.",
					args: "[status]"
				}),
				nested: {
					echo: jsh.script.cli.defineCommand(function(p) {
						jsh.shell.console(p.arguments[0]);
					}, {
						summary: "Echoes a nested command argument.",
						category: "Nested"
					})
				},
				unannotated: function(p) {
				},
				hidden: jsh.script.cli.defineCommand(function(p) {
				}, {
					summary: "Hidden command.",
					hidden: true
				}),
				old: jsh.script.cli.defineCommand(function(p) {
				}, {
					summary: "Old command.",
					deprecated: "Use status instead."
				}),
				alias: aliased,
				merged: merged
			},
			metadata: {
				alias: {
					summary: "Alias-specific summary."
				}
			}
		});
	}
//@ts-ignore
)(jsh);
