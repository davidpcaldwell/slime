//	We do not want to pre-load the Java compiler as it is way too slow to do so.
//	TODO	verify that this setup does not load it
$exports.__defineGetter__("javac", $api.experimental($context.api.js.constant(function() {
	debugger;
	var javac = Packages.javax.tools.ToolProvider.getSystemJavaCompiler();
	if (!javac) return function(){}();
	return function(p) {
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
		if (p.classpath && p.classpath.pathnames.length) {
			args.push("-classpath", p.classpath);
		}
		if (p.sourcepath && p.sourcepath.pathnames.length) {
			args.push("-sourcepath", p.sourcepath);
		}
		if (p.source) {
			args.push("-source", p.source);
		}
		if (p.target) {
			args.push("-target", p.target);
		}
		if (p.arguments) {
			args = args.concat(p.arguments.map(function(file) {
				return file.toString();
			}));
		}
		var status = javac.run(
			null, null, null, 
			$context.api.java.toJavaArray(
				args
				,Packages.java.lang.String
				,function(s) {
					return new Packages.java.lang.String(s)
				}
			)
		);
		var evaluate = (p.evaluate) ? p.evaluate : function(result) {
			if (status) {
				if (p && p.on && p.on.exit) {
					p.on.exit({
						status: status,
						arguments: args
					})
				}
				throw new Error();
			} else {
				return {
					status: status,
					arguments: args
				};
			}						
		};
		return evaluate({
			status: status,
			arguments: args
		});
	};
})));
