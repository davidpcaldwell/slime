plugin({
	isReady: function() {
		return typeof(jsh.java) != "undefined" && Packages.javax.tools.ToolProvider.getSystemJavaCompiler() != null;
	},
	load: function() {
		jsh.java.tools = new function() {
			var javac = Packages.javax.tools.ToolProvider.getSystemJavaCompiler();
			
			this.javac = function(p) {
				jsh.shell.echo("Compiler ...");
				var args = [];
				//	TODO	accept destination that is directory object, not just Pathname
				if (p.destination) {
					//	TODO	figure out what to do with recursive
					p.destination.createDirectory({
						ifExists: function(dir) {
							return false;
						},
						recursive: false
					});
					args.push("-d", p.destination);
				}
				if (p.classpath) {
					args.push("-classpath", p.classpath);
				}
				if (p.sourcepath) {
					args.push("-sourcepath", p.sourcepath);					
				}
				if (p.arguments) {
					args = args.concat(p.arguments);
				}
				var status = javac.run(
					null, null, null, jsh.java.toJavaArray(args,Packages.java.lang.String,function(s) {
						return new Packages.java.lang.String(s)
					})
				);
				if (status) {
					if (p && p.on && p.on.exit) {
						p.on.exit({
							status: status,
							arguments: args
						})
					}
					throw new Error();
				}
			}
		}
	}
})