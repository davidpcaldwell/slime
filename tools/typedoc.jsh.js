//@ts-check
(
	/**
	 *
	 * @param { jsh } jsh
	 */
	function(jsh) {
		$api.Function.pipe(
			jsh.wf.cli.$f.option.pathname({ longname: "output" }),
			jsh.wf.cli.$f.option.pathname({ longname: "input" }),
			function(p) {
				jsh.shell.tools.node.require();
				jsh.shell.tools.node.modules.require({ name: "typescript" });
				jsh.shell.tools.node.modules.require({ name: "typedoc" });
				var shell = jsh.script.file.parent.parent;
				var PATH = jsh.file.Searchpath(jsh.shell.PATH.pathnames.concat([shell.getRelativePath("local/jsh/lib/node/bin")]));
				var environment = $api.Object.compose(jsh.shell.environment, {
					PATH: PATH.toString()
				});
				var readme = (function(input) {
					var readme = input.directory.getFile("typedoc-index.md");
					if (readme) return readme.toString();
					return "none";
				})(p.options.input);
				var result = jsh.shell.run({
					command: shell.getRelativePath("local/jsh/lib/node/bin/typedoc"),
					arguments: [
						"--out", p.options.output,
						"--tsconfig", p.options.input.directory.getRelativePath("jsconfig.json"),
						"--mode", "file",
						"--includeDeclarations", "--excludeExternals",
						"--readme", readme
						//	TODO	add --name
						//,p.options.input
					],
					environment: environment,
					evaluate: function(result) {
						jsh.shell.exit(result.status);
					}
				});
				jsh.shell.exit(result.status);
			}
		)({ options: {}, arguments: jsh.script.arguments })
	}
//@ts-ignore
)(jsh);
