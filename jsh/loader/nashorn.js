var $engine = {};
var $javaloader = (function() {
	var $loader = eval($shell.getLoaderCode());
	var scripts = eval($loader.getLoaderCode("rhino/nashorn.js"));
	
	var rv = scripts.script(
		"rhino/nashorn.js",
		$loader.getLoaderCode("rhino/nashorn.js"),
		{ 
			$getLoaderCode: function(path) {
				return $loader.getLoaderCode(path);
			},
			$classpath: $nashorn.getClasspath() 
		},
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
			$nashorn.exit(status);
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
				Packages.java.lang.System.err.println(e);
				return 255;
			}
		});
	}
	
	return rv;
})();

$engine.$javaloader = $javaloader;

