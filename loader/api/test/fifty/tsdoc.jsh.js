//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		var parameters = jsh.script.getopts({
			options: {
				"node:debug": false,
				file: jsh.file.Pathname,
				ast: jsh.file.Pathname,
				to: jsh.file.Pathname
			}
		})

		jsh.shell.tools.node.require();
		jsh.shell.tools.node.modules.require({ name: "typescript" });
		jsh.shell.tools.node.modules.require({ name: "@microsoft/tsdoc" });

		/** @type { slime.fifty.Exports } */
		var module = jsh.script.loader.module("module.js", {
			library: {
				node: jsh.shell.tools.node
			}
		});

		var ast = module.ast({
			node: {
				script: jsh.script.file.parent.getRelativePath("tsdoc.node.js"),
				debug: parameters.options["node:debug"]
			},
			ast: parameters.options.ast,
			file: parameters.options.file
		});

		var documentation = module.interpret({
			ast: ast
		});

		parameters.options.to.write(JSON.stringify(documentation, void(0), "    "), { append: false });
	}
//@ts-ignore
)(jsh)
