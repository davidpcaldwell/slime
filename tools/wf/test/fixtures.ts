//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.wf.test {
	export interface Fixtures {
		/**
		 * Clones the repository given by p.src to a temporary directory, also copying the state of the working directory (if there
		 * are modified files in the `src`, they will also be modified in the returned "clone").
		 *
		 * If p.commit is given and files are modified, commits modified files with the given p.commit.message.
		 */
		clone: (p: {
			src: slime.jrunscript.file.Location
			commit?: {
				message: string
			}
		}) => slime.jrunscript.tools.git.repository.Local

		/**
		 * Sets an arbitrary `user.name` and `user.email` on the repository configuration for the given repository.
		 */
		configure: (repository: slime.jrunscript.tools.git.repository.Local) => void
	}

	export type Script = slime.loader.Script<void,(fifty: slime.fifty.test.Kit) => Fixtures>

	(
		function(
			$export: slime.loader.Export<(fifty: slime.fifty.test.Kit) => Fixtures>
		) {
			$export(function(fifty: slime.fifty.test.Kit) {
				const $api = fifty.global.$api;
				const jsh = fifty.global.jsh;

				/**
				 * Make sure `user.name` and `user.email` are set (to nonsense values).
				 *
				 * @param repository A repository to configure.
				 */
				function configure(repository: slime.jrunscript.tools.git.repository.Local) {
					repository.config({ set: { name: "user.name", value: "foo" }});
					repository.config({ set: { name: "user.email", value: "bar@example.com" }});
				}

				return {
					clone: function(p) {
						var clone: slime.jrunscript.tools.git.Command<{ repository: string, to: string }, void> = {
							invocation: function(p) {
								return {
									command: "clone",
									arguments: $api.Array.build(function(rv) {
										rv.push(p.repository);
										if (p.to) rv.push(p.to);
									})
								}
							}
						};

						var addAll: slime.jrunscript.tools.git.Command<void,void> = {
							invocation: function(p) {
								return {
									command: "add",
									arguments: ["."]
								}
							}
						};

						var commitAll: slime.jrunscript.tools.git.Command<{ message: string },void> = {
							invocation: function(p) {
								return {
									command: "commit",
									arguments: ["--all", "--message", p.message]
								};
							}
						};

						var src: slime.jrunscript.file.Location = p.src;

						var gitdir = $api.fp.now(p.src, jsh.file.Location.directory.relativePath(".git"));

						var isGitClone = (
							$api.fp.now(gitdir, jsh.file.Location.file.exists.simple)
							|| $api.fp.now(gitdir, jsh.file.Location.directory.exists.simple)
						);

						var destination = $api.fp.world.now.ask(jsh.file.Location.from.temporary(jsh.file.world.filesystems.os)({ directory: true }));

						if (isGitClone) {
							jsh.tools.git.program({ command: "git" }).command(clone).argument({
								repository: src.pathname,
								to: destination.pathname
							}).run();
						}

						//	copy code so that we get local modifications in our "clone"
						//	TODO	this is horrendouly inefficient, listing and iterating through lots of directories we are not
						//			going to copy. We should rather filter the directory listing and then only copy
						jsh.file.object.directory(src).copy(jsh.file.object.pathname(destination), {
							filter: function(p) {
								//	Prevents copying of the .git *file* in submodules
								if (/\.git$/.test(p.entry.path)) return false;

								//	Prevents copying of files under the .git and local directories
								if (/\.git\//.test(p.entry.path)) return false;
								if (/local\//.test(p.entry.path)) return false;

								//	Prevents copying of files under the submodule path
								//	TODO	this is not very generalized; it does allow the standard wf plugin tests to pass
								if (/slime\//.test(p.entry.path)) return false;
								if (/node_modules\//.test(p.entry.path)) return false;

								//	If we are a directory but the clone contains a file, remove the file and overwrite
								if (p.exists && !p.exists.directory && p.entry.node.directory) {
									p.exists.remove();
									return true;
								}

								return true;
							}
						});

						(
							function removeLocallyRemovedFilesFromClone() {
								if (!isGitClone) return;
								var cloned = jsh.file.object.directory(destination).list({
									type: jsh.file.list.ENTRY,
									filter: function(node) {
										return !node.directory;
									},
									descendants: function(directory) {
										return directory.pathname.basename != ".git" && directory.pathname.basename != "local";
									}
								});
								cloned.forEach(function(entry) {
									var deleted = !jsh.file.object.directory(src).getFile(entry.path);
									if (deleted) {
										if (entry.path != ".git") {
											jsh.shell.console("Deleting cloned file deleted locally: " + entry.path);
											jsh.file.object.directory(destination).getFile(entry.path).remove();
										}
									}
								});
							}
						)();

						if (isGitClone) {
							var rv = jsh.tools.git.oo.Repository({ directory: jsh.file.Pathname(destination.pathname).directory });
							if (p.commit && rv.status().paths) {
								configure(rv);
								var repository = jsh.tools.git.program({ command: "git" }).repository(destination.pathname);
								//	Add untracked files
								repository.command(addAll).argument().run();
								repository.command(commitAll).argument({ message: p.commit.message }).run({
									stderr: function(line) {
										jsh.shell.console(line);
									}
								});
							}
							return rv;
						} else {
							//	TODO	horrendous
							return {
								directory: {
									pathname: {
										os: {
											adapt: function() { return destination; }
										}
									}
								}
							} as unknown as slime.jrunscript.tools.git.repository.Local
						}
						//	good utility functions for git module?
						// function unset(repository,setting) {
						// 	jsh.shell.console("Unset: " + repository.directory);
						// 	jsh.shell.run({
						// 		command: "git",
						// 		arguments: ["config", "--local", "--unset", setting],
						// 		directory: repository.directory
						// 	});
						// }
						// var gitdir = (function() {
						// 	if (src.getSubdirectory(".git")) {
						// 		return src.getSubdirectory(".git");
						// 	}
						// 	if (src.getFile(".git")) {
						// 		var parsed = /^gitdir\: (.*)/.exec(src.getFile(".git").read(String));
						// 		var relative = (parsed) ? parsed[1] : null;
						// 		return (relative) ? src.getRelativePath(relative).directory : void(0);
						// 	}
						// })();
					},
					configure: configure
				};
			})
		}
	//@ts-ignore
	)($export);
}
