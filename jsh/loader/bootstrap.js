new (function() {
	this.getLoaderCode = function(path) {
		return $shell.getStreams().readString($shell.getInstallation().getPlatformLoader(path).getReader());
	};
});
