jsh.script.Application.run({
	commands: {
		definition: {
			getopts: {
				options: {
					to: jsh.file.Pathname
				}
			},
			run: function(parameters) {
				var code = jsh.shell.jsh.src.getFile("loader/api/api.template.html").read(String);
				var start = code.indexOf("<!DOCTYPE");
				code = code.substring(start);
				parameters.options.to.write(code, { append: false });
			}
		}
	}
})