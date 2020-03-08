plugin({
	load: function() {
		jsh.sdlc = {};
		jsh.sdlc.git = {};
		jsh.sdlc.git.removeMerged = function(p) {
			throw new Error("Unimplemented");
		};
	}
})