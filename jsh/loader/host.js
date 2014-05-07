var $host = new function() {
	this.getRhinoLoader = function() {
		return $engine.$javaloader;
	};
	
	this.getPlugins = function(file) {
		return Packages.inonit.script.jsh.Installation.Plugin.get(file);
	}
};
