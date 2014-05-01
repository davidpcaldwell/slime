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
	
	//	TODO	addFinalizer
	//	TODO	destroy
};