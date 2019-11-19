jsh.script.Application.run({
	commands: {
		tsc: {
			getopts: {
				options: {
					output: jsh.file.Pathname
				}
			},
			run: function(parameters) {
				jsh.shell.console("tsc");
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
						rv.push("--allowJs");
						rv.push("--checkJs");
						rv.push(jsh.script.file.parent.getFile("foo.ts"));
					}
				});
				jsh.shell.console("output = " + output);
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
		}
	}
});
