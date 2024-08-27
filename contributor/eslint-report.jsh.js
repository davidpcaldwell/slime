//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		var base = jsh.script.file.parent.parent;

		var json = base.getFile(".eslintrc.json").read(String);
		var configuration = eval("(" + json + ")");
		var rules = Object.entries(configuration.rules).filter(function(entry) {
			return entry[1] == "warn" || entry[1].length > 1 && entry[1][0] == "warn";
		}).map(function(entry) {
			return entry[0];
		});
		//jsh.shell.console("rules = " + Object.keys(configuration.rules));

		$api.fp.world.execute(jsh.shell.tools.node.require.action);

		var node = jsh.shell.tools.node.installed;

		node.modules.require({ name: "eslint", version: "8.57.0" });

		var results = node.run({
			command: "eslint",
			arguments: [/*"--debug",*/ "--format", "json", "."],
			directory: base,
			stdio: {
				output: String
			},
			evaluate: function(result) {
				return JSON.parse(result.stdio.output);
			}
		});

		// var messages = results.reduce(function(rv,item) {
		// 	return rv.concat(item.messages);
		// },[]);

		// jsh.shell.console(JSON.stringify(messages));
		// jsh.shell.console(String(messages.length));

		var warnings = results.reduce(function(rv,item) {
			return rv.concat(
				item.messages.map(function(message) {
					return $api.Object.compose(message, {
						file: item.filePath
					})
				})
			)
		},[]);

		// jsh.shell.console(JSON.stringify(results, void(0), 4));
		rules.map(function(name) {
			return {
				name: name,
				violations: warnings.filter(function(warning) {
					return warning.ruleId == name;
				})
			}
		}).sort(function(a,b) {
			return b.violations.length - a.violations.length;
		}).forEach(function(rule) {
			jsh.shell.console(rule.name + ": " + rule.violations.length);
			rule.violations.forEach(function(violation) {
				jsh.shell.console(violation.file + ":" + violation.line + ":" + violation.column + " " + violation.message);
			})
		});
	}
//@ts-ignore
)($api,jsh);
