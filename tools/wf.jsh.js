//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		if (!jsh.wf.project.base.getFile("wf.js")) {
			jsh.shell.console("Directory " + jsh.wf.project.base + " does not appear to be a project directory; no wf.js found.");
			jsh.shell.exit(1);
		}

		var project = new jsh.file.Loader({ directory: jsh.wf.project.base }).module("wf.js", {
			base: jsh.wf.project.base
		});

		var parameters = $api.Function.result(
			{
				options: {},
				arguments: jsh.script.arguments
			},
			function(p) {
				return {
					command: p.arguments[0],
					options: p.options,
					arguments: p.arguments.slice(1)
				}
			}
		);

		if (project.initialize && parameters.command != "initialize") {
			project.initialize();
		}

		var getCommand = function(project,command) {
			var rv = project;
			var tokens = command.split(".");
			for (var i=0; i<tokens.length; i++) {
				if (rv) {
					rv = rv[tokens[i]];
				}
			}
			return rv;
		}

		var command = getCommand(project,parameters.command);

		if (command) {
			command({
				options: parameters.options,
				arguments: parameters.arguments
			});
		} else {
			jsh.shell.console("Project at " + jsh.wf.project.base + " does not have a '" + parameters.command + "' command.")
		}
	}
//@ts-ignore
)($api,jsh);
