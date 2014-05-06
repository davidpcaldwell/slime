var $loader = new function() {
	var _streams = new Packages.inonit.script.runtime.io.Streams();

	this.getLoaderCode = function(path) {
		return _streams.readString($shell.getInstallation().getPlatformLoader(path).getReader());
	};
};
