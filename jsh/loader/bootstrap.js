new (function() {
	this.getLoaderCode = function(path) {
		return $jsh.getStreams().readString($jsh.getInstallation().getPlatformLoader(path).getReader());
	};
	
	this.getCoffeeScript = function() {
		var _library = $jsh.getInstallation().getLibrary("coffee-script.js");
		if (!_library) return null;
		return $jsh.getStreams().readString(_library.getReader());
	}
});
