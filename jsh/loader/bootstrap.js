new (function() {
	this.getLoaderCode = function(path) {
		return $jsh.getStreams().readString($jsh.getInstallation().getPlatformLoader(path).getReader());
	};
});
