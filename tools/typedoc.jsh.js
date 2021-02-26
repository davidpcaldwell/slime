//@ts-check
(
	/**
	 *
	 * @param { $api } $api
	 * @param { jsh } jsh
	 */
	function($api,jsh) {
		$api.Function.pipe(
			jsh.wf.cli.$f.option.string({ longname: "ts:version" }),
			jsh.wf.cli.$f.option.pathname({ longname: "tsconfig" }),
			jsh.wf.cli.$f.option.pathname({ longname: "output" }),
			function(p) {
				jsh.shell.tools.rhino.require();
				jsh.shell.tools.tomcat.require();
				jsh.shell.tools.node.require();
				jsh.shell.tools.node.modules.require({ name: "typescript", version: p.options["ts:version"] });
				jsh.shell.tools.node.modules.require({ name: "typedoc", version: "0.19.2" });
				var shell = jsh.script.file.parent.parent;
				var PATH = jsh.file.Searchpath(jsh.shell.PATH.pathnames.concat([shell.getRelativePath("local/jsh/lib/node/bin")]));
				var environment = $api.Object.compose(jsh.shell.environment, {
					PATH: PATH.toString()
				});
				var readme = (function(project) {
					var readme = project.directory.getFile("typedoc-index.md");
					if (readme) return readme.toString();
					return "none";
				})(p.options.tsconfig.parent);
				var result = jsh.shell.run({
					command: shell.getRelativePath("local/jsh/lib/node/bin/typedoc"),
					arguments: [
						"--out", p.options.output,
						"--tsconfig", p.options.tsconfig,
						"--mode", "file",
						"--includeDeclarations",
						"--excludeExternals",
						"--readme", readme
						//	TODO	add --name
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
)($api,jsh);
