(
	function() {
		var directory = jsh.shell.TMPDIR.createTemporary({ directory: true });
		var repository = jsh.tools.git.init({ pathname: directory.pathname });
		jsh.wf.requireGitIdentity({
			repository: repository,
			get: jsh.wf.requireGitIdentity.get.gui
		});
		var config = repository.config({
			arguments: ["--list"]
		});
		jsh.shell.console(JSON.stringify({
			name: config["user.name"],
			email: config["user.email"]
		}));
	}
)()
