//@ts-check
(function(p) {
	var parameters = jsh.script.getopts({
		options: {
			declaration: p.file.parent.getRelativePath("test/data/module.d.ts")
		}
	}, p.arguments);

	/** @type { slime.definition.verify.Factory } */
	var Verify = jsh.loader.file(jsh.shell.jsh.src.getFile("loader/api/verify.js")).Verify;

	var console = new function() {
		var write = function(indent,string) {
			var prefix = new Array(indent + 1).join("  ")
			jsh.shell.console(prefix + string);
		};

		this.start = function(indent,name) {
			write(indent, "RUN: " + name);
		};

		this.end = function(indent,name,result) {
			var resultString = (result) ? "PASSED" : "FAILED"
			write(indent, resultString + ": " + name);
		};

		this.test = function(indent,message) {
			write(indent, message);
		}
	}

	/** @type { new (p?: {}) => slime.definition.verify.Scope & { success: boolean, start: Function, end: Function } } */
	var Scope = function(p) {
		if (!p) p = {};

		this.success = true;

		this.parent = (p.parent) ? p.parent : null;

		this.depth = function() {
			return (this.parent) ? this.parent.depth() + 1 : 0;
		};

		this.toString = function() {
			return "Scope: " + this.depth();
		}

		this.start = function(name) {
			console.start(this.depth() + 1, name);
		}

		this.end = function(name,result) {
			console.end(this.depth() + 1, name, result);
		}

		this.fail = function() {
			this.success = false;
			if (p.parent) p.parent.fail();
		}

		/** @param { slime.definition.verify.Scope.Test } f */
		this.test = function(f) {
			var result = f();
			if (result.success === false) {
				fail();
				console.test(this.depth() + 1, result.message);
			} else if (result.success === true) {
				//	do nothing
			} else {
				throw new TypeError();
			}
			console.test(this.depth() + 1, result.message);
		}
	}

	var execute = function(file) {
		/** @type { slime.definition.verify.Scope & { success: boolean, start: Function, end: Function } } */
		var scope = new Scope();

		var verify = Verify(scope);

		var loader = Object.assign(
			new jsh.file.Loader({ directory: file.parent }),
			{ getRelativePath: function(path) { return file.parent.getRelativePath(path); } }
		)

		var tests = {
			types: {}
		};

		loader.run(file.pathname.basename, $api.Object.compose({
			$loader: loader,
			run: function(code,name) {
				if (!name) name = "run";
				scope.start(name);
				var was = {
					scope: scope,
					verify: verify
				};
				verify = Verify(new Scope({ parent: scope }));
				code();
				var result = scope.success;
				scope = was.scope;
				verify = was.verify;
				scope.end(name,result);
			},
			tests: tests
		}, new function() {
			this.verify = function() {
				return verify.apply(this,arguments);
			}
		}));

		console.start(0, file);
		tests.suite();
		console.end(0, file, scope.success);

		return scope.success;
	};

	var success = execute(parameters.options.declaration.file);
	jsh.shell.console( (success) ? "Success." : "FAILED!" );
	jsh.shell.exit( (success) ? 0 : 1 )
//@ts-ignore
})({ file: jsh.script.file, arguments: jsh.script.arguments });
