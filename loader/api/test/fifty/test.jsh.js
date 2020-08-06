//@ts-check
(
	/**
	 * @param { jsh } jsh
	 */
	function(jsh) {
		var parameters = jsh.wf.cli.$f.invocation(
			$api.Function.pipe(
				$api.Function.impure.revise(function(p) {
					var path = p.arguments.shift();
					var definition = jsh.script.getopts.parser.Pathname(path);
					//	check for existence
					p.options.definition = definition.file;
				}),
				jsh.wf.cli.$f.option.string({ longname: "part" }),
				$api.Function.impure.revise(function(p) {
					if (!p.options.part) p.options.part = "suite";
				})
			)
		);

		/** @type { slime.definition.verify.Factory } */
		var Verify = jsh.loader.file(jsh.shell.jsh.src.getFile("loader/api/verify.js")).Verify;

		var console = new function() {
			var write = function(indent,string) {
				var prefix = new Array(indent + 1).join("  ")
				jsh.shell.console(prefix + string);
			};

			this.start = function(indent,name) {
				write(indent, "Running: " + name);
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
					this.fail();
				} else if (result.success === true) {
					//	do nothing
				} else {
					throw new TypeError();
				}
				console.test(this.depth() + 1, result.message);
			}
		}

		var execute = function(file,part) {
			/** @type { slime.definition.verify.Scope & { success: boolean, start: Function, end: Function } } */
			var scope = new Scope();

			var verify = Verify(scope);

			var delegate = new jsh.file.Loader({ directory: file.parent });
			var loader = Object.assign(
				delegate,
				{
					getRelativePath: function(path) { return file.parent.getRelativePath(path); },
					plugin: {
						mock: function(p) {
							var global = (function() { return this; })();
							return global.jsh.$fifty.plugin.mock(
								$api.Object.compose(
									p,
									{ $loader: delegate }
								)
							);
						}
					}
				}
			)

			var tests = {
				types: {}
			};

			loader.run(file.pathname.basename, $api.Object.compose({
				jsh: jsh,
				$loader: loader,
				run: function(code,name) {
					if (!name) name = "run";
					scope.start(name);
					var was = {
						scope: scope,
						verify: verify
					};
					scope = new Scope({ parent: scope });
					verify = Verify(scope);
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

			var target = tests;
			part.split(".").forEach(function(token) {
				target = $api.Function.optionalChain(token)(target)
			});
			if (typeof(target) == "function") {
				/** @type { () => void } */
				var callable = target;
				//	TODO	probably should print test being run as well in case part is not suite
				console.start(0, file);
				callable();
				console.end(0, file, scope.success);
			} else {
				jsh.shell.console("Not a function: " + part);
			}

			return scope.success;
		};

		var success = execute(parameters.options.definition,parameters.options.part);
		jsh.shell.exit( (success) ? 0 : 1 )
	}
//@ts-ignore
)(jsh);
