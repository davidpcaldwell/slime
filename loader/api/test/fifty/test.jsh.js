//@ts-check
(function(p) {
	var parameters = jsh.script.getopts({
		options: {
			declaration: p.file.parent.getRelativePath("test/data/module.d.ts")
		}
	}, p.arguments);

	/** @type { slime.definition.verify.Factory } */
	var Verify = jsh.loader.file(jsh.shell.jsh.src.getFile("loader/api/verify.js")).Verify;

	var execute = function(file) {
		/** @type { slime.definition.verify.Scope } */
		var scope = new function() {
			this.success = true;

			/** @param { slime.definition.verify.ScopeTest } f */
			this.test = function(f) {
				var result = f();
				if (result.success === false) {
					this.success = false;
					jsh.shell.console(result.message);
				} else if (result.success === true) {
					//	do nothing
					jsh.shell.console(result.message);
				} else {
					throw new TypeError();
				}
			}
		};

		var verify = Verify(scope);

		var file = parameters.options.declaration.file;

		var loader = new jsh.file.Loader({ directory: file.parent });

		var tests = {
			types: {}
		};

		loader.run(file.pathname.basename, {
			$loader: loader,
			verify: verify,
			tests: tests
		});

		tests.suite();

		return scope.success;
	};

	var success = execute(parameters.options.file);
	jsh.shell.console( (success) ? "Success." : "FAILED!" );
	jsh.shell.exit( (success) ? 0 : 1 )
//@ts-ignore
})({ file: jsh.script.file, arguments: jsh.script.arguments });
