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

		$api.fp.world.execute(jsh.shell.tools.node.require.action);

		var installation = jsh.shell.tools.node.installation;

		/** @type { slime.jrunscript.tools.node.Project } */
		var project = {
			base: base.pathname.toString()
		};

		var modules = jsh.shell.tools.node.Project.modules(project)(installation);

		var action = modules.require({ name: "eslint", version: "9.13.0" });

		jsh.shell.console("Require eslint 9.13.0 ...");
		$api.fp.world.Action.now({
			action: action
		});

		var eslintInstallDefaultsAction = modules.require({ name: "@eslint/js" });

		jsh.shell.console("Require @eslint/js ...");
		$api.fp.world.Action.now({
			action: eslintInstallDefaultsAction
		});

		var rulesCommand = $api.fp.world.Sensor.now({
			sensor: jsh.shell.subprocess.question,
			subject: $api.fp.now(
				/** @type { slime.jrunscript.tools.node.Intention } */ ({
					arguments: [jsh.script.file.parent.getRelativePath("eslint-report.node.js").toString()],
					directory: base.pathname.toString(),
					stdio: {
						output: "string"
					}
				}),
				jsh.shell.tools.node.Installation.Intention.shell,
				function(f) {
					return f(installation);
				}
			)
		});

		var rulesOutput = JSON.parse(rulesCommand.stdio.output);

		var rules = Object.entries(rulesOutput).filter(function(entry) {
			return entry[1] == "warn" || entry[1].length > 1 && entry[1][0] == "warn";
		}).map(function(entry) {
			return entry[0];
		});

		var src = jsh.script.file.parent.parent;

		var result = jsh.shell.tools.node.installed.run({
			project: src,
			command: "eslint",
			arguments: ["--format", "json"],
			directory: src,
			stdio: {
				output: String
			}
			// evaluate: function(result) {
			// 	jsh.shell.exit(result.status);
			// }
		});

		// var sensor = jsh.shell.tools.node.Installation.Intention.question({
		// 	command: "eslint",
		// 	arguments: ["--format", "json"],
		// 	directory: base.pathname.toString(),
		// 	stdio: {
		// 		output: "string"
		// 	}
		// });

		// var result = $api.fp.world.Sensor.now({
		// 	sensor: sensor,
		// 	subject: installation,
		// 	handlers: {
		// 		stderr: function(e) {
		// 			jsh.shell.console("STDERR: " + e.detail.line);
		// 		}
		// 	}
		// });

		var results = JSON.parse(result.stdio.output);

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

		jsh.shell.exit(result.status);
	}
//@ts-ignore
)($api,jsh);
