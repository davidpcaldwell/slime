//@ts-check
(
	/**
	 *
	 * @param { $api } $api
	 * @param { jsh } jsh
	 */
	function($api,jsh) {
		$api.Function.pipe(
			jsh.wf.cli.$f.option.string({ longname: "revisionRange" }),
			function(p) {
				var repository = jsh.tools.git.Repository({ directory: jsh.shell.PWD });
				jsh.shell.console("revision range = " + p.options.revisionRange);
				var log = repository.log({
					revisionRange: p.options.revisionRange
				});
				jsh.shell.console(JSON.stringify(log));
			}
		)({
			options: {},
			arguments: jsh.script.arguments
		})
	}
//@ts-ignore
)($api,jsh);