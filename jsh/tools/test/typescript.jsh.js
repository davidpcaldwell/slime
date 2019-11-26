var compile = function(parameters) {
	var output = (parameters.options.output) 
		? parameters.options.output.createDirectory({ 
			exists: function(dir) {
				dir.remove();
				return true;
			}
		})
		: jsh.shell.TMPDIR.createTemporary({ directory: true });

	jsh.shell.tools.node.run({
		command: "tsc",
		arguments: function(rv) {
			rv.push("--outDir", output);
			rv.push("--module", parameters.options.module);
			rv.push(parameters.options.input);
		}
	});

	return output;
}

jsh.script.Application.run({
	commands: {
		tsc: {
			getopts: {
				options: {
					input: jsh.script.file.parent.getRelativePath("foo.ts"),
					module: "ES6",
					output: jsh.file.Pathname
				}
			},
			run: function(parameters) {
				jsh.shell.console("tsc");
				var destination = compile(parameters);
				jsh.shell.console("output = " + destination);
				var name = parameters.options.input.basename.replace(/\.ts$/, ".js");
				var compiled = destination.getRelativePath(name);
				jsh.shell.console(compiled);
				var output = destination.getFile(name);
				jsh.shell.console(output.read(String));
			}
		},
		compile: {
			getopts: {},
			run: function(parameters) {
				var Map = function() {
				};
				Map.prototype.entries = {};
				jsh.shell.console("compile");
				var code = jsh.shell.jsh.src.getFile("local/jsh/lib/node/lib/node_modules/typescript/lib/tsc.js").read(String);
				jsh.shell.console("code = " + code.length);
				eval(code);
			}
		},
		loader: {
			getopts: {
				optinos: {
					output: jsh.file.Pathname					
				}
			},
			run: function(parameters) {
				var foo = jsh.loader.file(jsh.script.file.parent.getRelativePath("foo.ts"), {
					prefix: "x"
				});
				jsh.shell.console("foo.foo = " + foo.foo);
			}
		}
	}
});
