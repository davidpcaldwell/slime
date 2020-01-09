var src = jsh.script.file.parent.parent.parent.parent;
jsh.shell.console("src = " + src);
var repository = new jsh.tools.git.Repository({ directory: src });
jsh.shell.console("repository = " + repository);
var remote = repository.remote.getUrl({ name: "origin" });
jsh.shell.console("remote = " + remote);
