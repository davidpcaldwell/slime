namespace slime.jrunscript.git {
	export interface Installation {
		/**
		 * Creates a new repository at the given location (see `git init`).
		 *
		 * @returns The local repository created.
		 */
		init: (p: {
			/**
			 * A location at which to create an empty repository.
			 */
			pathname: slime.jrunscript.file.Pathname
		}, events?: $api.Events.Handler<"stdout" | "stderr">) =>
			slime.jrunscript.git.Repository.Local
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var verify = fifty.verify;
			var module = jsh.tools.git;

			var fixture = {
				write: function(o) {
					var directory = (function() {
						if (o.repository) return o.repository.directory;
						if (o.directory) return o.directory;
					})();
					for (var x in o.files) {
						//	TODO	add function form which receives string as argument
						directory.getRelativePath(x).write(o.files[x], { append: false });
					}
				}
			};

			fifty.tests.Installation = {};
			fifty.tests.Installation.init = function() {
				var location = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
				fixture.write({
					directory: location.directory,
					files: {
						"a": "a"
					}
				});

				var captor = (function() {
					var stdout: $api.Event<string>[] = [];
					var stderr = [];

					return {
						output: stdout,
						error: stderr,

						stdout: function(e) {
							stdout.push(e);
						},

						stderr: function(e) {
							stderr.push(e);
						}
					};
				})();

				var repository = module.init({
					pathname: location
				}, captor);

				verify(repository).is.type("object");
				verify(repository).directory.getFile("a").is.type("object");
				verify(captor).output.length.is(2);
				verify(captor).output[1].detail.is("");
			};

			fifty.tests.suite = function() {
				run(fifty.tests.Installation.init);
			}
		}
	//@ts-ignore
	)(fifty)
}