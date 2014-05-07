var $engine = {};
var $javaloader = (function() {
	var $loader = eval($shell.getLoaderCode());
	var scripts = eval($loader.getLoaderCode("rhino/nashorn.js"));
	
	var $engine = new function() {
		this.getClasspath = function() {
			return $nashorn.getClasspath();
		}
	};

	var rv = scripts.script(
		"rhino/nashorn.js",
		$loader.getLoaderCode("rhino/nashorn.js"),
		{ $loader: $loader, $classpath: $nashorn.getClasspath() },
		null
	);
	
	rv.jsapi = new function() {
		this.script = function(name,code,scope) {
			return scripts.script(name, String(code), scope);
		}
	}
	
	rv.exit = function(status) {
		if ($nashorn.isTop()) {
			exit(status);
		} else {
			//	NASHORN	Throwing object with toString() causes [object Object] to be error rather than toString()
			throw new Packages.inonit.script.jsh.Nashorn.ExitException(status);
		}
	}
	
	rv.jsh = function(configuration,invocation) {
		var subshell = Packages.inonit.script.jsh.Shell.create(
			$shell.getInstallation(),
			configuration,
			invocation
		);
		return scripts.subshell(function() {
			try {
				return Packages.inonit.script.jsh.Nashorn.execute(subshell);				
			} catch (e) {
				return 255;
			}
		});
	}
	
	return rv;
})();

$engine.$javaloader = $javaloader;

