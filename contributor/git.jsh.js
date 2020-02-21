jsh.script.Application.run({
	options: {
		repository: jsh.file.Pathname
	},
	commands: {
		"remove-merged": {
			getopts: {},
			run: function(parameters) {
				//	TODO	should we merge in global options?
				if (!parameters.global.repository) parameters.global.repository = jsh.script.file.parent.parent.pathname;
				/** @type { slime.jrunscript.git.LocalRepository } */
				var repository = new jsh.tools.git.Repository({ directory: parameters.global.repository.directory });
				jsh.shell.console("Repository: " + repository);
				var branches = repository.branch({ all: true });
				branches.forEach(function(branch) {
					jsh.shell.console(branch.name + " " + JSON.stringify(branch));
					jsh.shell.console("");
				});

				var remotePattern = /^remotes\/(.+?)\/(.*)$/;

				var isRemote = function(branch) {
					return remotePattern.test(branch.name);
				}

				branches.forEach(function(branch) {
					if (branch.name != "master") {
						//jsh.shell.console(branch.name);
						var common = repository.mergeBase({
							commits: ["master", branch.name]
						});
						if (common.commit.hash == branch.commit.commit.hash) {
							var remote = isRemote(branch);
							jsh.shell.console("Remove: " + branch.name + " remote = " + isRemote(branch));
							if (remote) {
								var match = remotePattern.exec(branch.name);
								if (match[2] != "master") {
									jsh.shell.console("Delete remote: " + match[1] + " name: " + match[2]);
									repository.push({
										delete: true,
										repository: match[1],
										refspec: match[2]
									});
								} else {
									jsh.shell.console("Not deleting remote: " + match[1] + " name: " + match[2]);
								}
							} else {
								jsh.shell.console("Delete local: " + branch.name);
								repository.branch({ delete: branch.name });
							}
						} else {
							jsh.shell.console(Object.keys(branch));
							jsh.shell.console(Object.keys(branch.commit));
							jsh.shell.console("Unmerged: " + branch.name + " common=" + common.commit.hash + " " + " branch=" + branch.commit.commit.hash);
						}
					}
				});
			}
		}
	}
})