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

		/** @type { slime.jsh.script.cli.Descriptor<{}> } */
		var descriptor = {
			options: $api.Function.identity,
			commands: new jsh.file.Loader({ directory: jsh.wf.project.base }).module("wf.js", {
				base: jsh.wf.project.base
			})
		}

		/** @type { slime.jsh.script.cli.Commands<{}> & { initialize?: slime.jsh.script.cli.Command<{}> } } */
		var project = descriptor.commands;

		var invocation = jsh.script.cli.invocation(descriptor.options);

		if (invocation.arguments[0] != "initialize" && project.initialize) {
			project.initialize({
				options: {},
				arguments: []
			});
		}

		jsh.script.cli.wrap(
			descriptor
		)

		// var getCommand = function(project,command) {
		// 	if (typeof(command) == "undefined") return void(0);
		// 	var rv = project;
		// 	var tokens = command.split(".");
		// 	for (var i=0; i<tokens.length; i++) {
		// 		if (rv) {
		// 			rv = rv[tokens[i]];
		// 		}
		// 	}
		// 	return rv;
		// };

		// var command = getCommand(project,parameters.command);

		// if (command) {
		// 	command({
		// 		options: parameters.options,
		// 		arguments: parameters.arguments
		// 	});
		// } else {
		// 	if (typeof(parameters.command) != "undefined") {
		// 		jsh.shell.console("Project at " + jsh.wf.project.base + " does not have a '" + parameters.command + "' command.");
		// 	}
		// 	var list = [];
		// 	getCommandList(list,project);
		// 	jsh.shell.console("Available wf commands for " + jsh.wf.project.base + ":");
		// 	jsh.shell.console(list.join("\n"));
		// }
	}
//@ts-ignore
)($api,jsh);
