//@ts-check
(function() {
	var tests = {
		types: {}
	};

	/** @type { slime.definition.verify.Factory } */
	var Verify = jsh.loader.file(jsh.shell.jsh.src.getFile("loader/api/verify.js")).Verify;

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

	jsh.script.loader.run("module.d.ts", {
		$loader: jsh.script.loader,
		verify: verify,
		tests: tests
	});

	tests.suite();
})();
