plugin({
	isReady: function() {
		return jsh.http && jsh.shell;
	},
	load: function() {
		if (!jsh.tools) jsh.tools = {};
		jsh.tools.install = $loader.module("module.js", {
			api: {
				shell: jsh.shell,
				http: jsh.http
			},
			downloads: jsh.shell.user.downloads			
		});
	}
});