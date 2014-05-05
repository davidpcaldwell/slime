var $engine = new function() {
	this.script = function(name,code,scope,target) {
		return $rhino.script(name,code,scope,target);
	};
	
	this.getClasspath = function() {
		return $rhino.getClasspath();
	};
	
	this.getDebugger = function() {
		return $rhino.getDebugger();
	};
	
	//	toScope apparently not necessary
	
	this.exit = function(status) {
		return $rhino.exit(status);
	};
	
	this.jsh = function(configuration,invocation) {
		return $rhino.jsh(configuration,invocation);
	};
	
	this.setReadOnly = function(object,name,value) {
		if (!arguments.callee.objects) {
			arguments.callee.objects = new Packages.inonit.script.rhino.Objects();
		}
		arguments.callee.objects.setReadOnly(object,name,value);							
	};
	
	this.MetaObject = function(p) {
		var delegate = (p.delegate) ? p.delegate : {};
		var get = (p.get) ? p.get : function(){};
		var set = (p.set) ? p.set : function(){};
		return Packages.inonit.script.rhino.MetaObject.create(delegate,get,set);
	};
	
	//	TODO	addFinalizer
	//	TODO	destroy
};
$engine.$javaloader = (function() {
	var _streams = new Packages.inonit.script.runtime.io.Streams();

	var $bootstrap = new function() {
		this.getLoaderCode = function(path) {
			return _streams.readString($shell.getInstallation().getPlatformLoader(path).getReader());
		};
	}

	//	Try to port inonit.script.rhino.Loader.Bootstrap
	return $engine.script("rhino/rhino.js", $bootstrap.getLoaderCode("rhino/rhino.js"), { $loader: $bootstrap, $engine: $rhino }, null);
})();
