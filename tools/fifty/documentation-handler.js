//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * Implementation of the Typedoc documentation server. Currently relies on the `jsh` and `httpd` APIs, but probably could
	 * narrow dependencies on those.
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.tools.documentation.Export> } $export
	 */
	function($api,jsh,$loader,$export) {
		$export(
			function(configuration) {
				var base = configuration.base;

				var code = {
					/** @type { slime.tools.documentation.internal.asTextHandler.Script } */
					asTextHandler: $loader.script("as-text-handler.js"),
					/** @type { slime.tools.documentation.updater.Script } */
					updater: $loader.script("documentation-updater.js")
				}

				var library = {
					updater: code.updater({
						library: {
							java: jsh.java,
							file: jsh.file,
							shell: jsh.shell,
							code: jsh.project.code
						},
						typedoc: {
							invocation: jsh.wf.typescript.typedoc.invocation
						}
					})
				}

				/**
				 *
				 * @param { slime.jrunscript.file.Directory } src
				 * @returns
				 */
				function synchronousUpdate(src) {
					var invocation = jsh.wf.typescript.typedoc.invocation({
						project: { base: src.toString() },
						stdio: {
							output: "string",
							error: "string"
						}
					});
					var result = $api.fp.world.now.ask(
						invocation
					);
					if (result.status != 0) {
						return {
							status: { code: 500 },
							body: {
								type: "text/plain",
								string: "TypeDoc invocation failed:\nSTDOUT:\n" + result.stdio.output + "\nSTDERR:\n" + result.stdio.error
							}
						}
					}
				}

				var updater = library.updater.Updater({
					project: base.toString(),
					events: {
						initialized: function(e) {
							jsh.shell.console("Initialized: project=" + e.detail.project);
						},
						creating: function(e) {
							jsh.shell.console("Creating documentation ...");
						},
						setInterval: function(e) {
							jsh.shell.console("Set interval to " + e.detail + " milliseconds at " + new Date() + ".");
						},
						unchanged: function(e) {
							jsh.shell.console(
								"Checked; unchanged -"
								+ " code = " + new Date(e.detail.code)
								+ " documentation = " + new Date(e.detail.documentation)
							);
						},
						updating: function(e) {
							jsh.shell.console("Updating at " + new Date() + ": out=" + e.detail.out);
						},
						stdout: function(e) {
							jsh.shell.console(e.detail.out + " STDOUT: " + e.detail.line);
						},
						stderr: function(e) {
							jsh.shell.console(e.detail.out + " STDERR: " + e.detail.line);
						},
						stopping: function(e) {
							jsh.shell.console("Stopping: " + e.detail.out + " ...");
						},
						finished: function(e) {
							jsh.shell.console("Finished updating: was " + e.detail.out);
						},
						errored: function(e) {
							jsh.shell.console("Errored; was to write to " + e.detail.out);
						},
						destroying: function(e) {
							jsh.shell.console("Destroying handler ...");
						},
						destroyed: function(e) {
							jsh.shell.console("Destroyed handler.");
						}
					}
				});

				jsh.java.Thread.start({
					call: function() {
						updater.run();
					}
				});

				return function(httpd) {
					var asTextHandler = code.asTextHandler({ httpd: httpd });

					return {
						handle: httpd.Handler.series(
							//	Allows links to src/path/to/file.ext within Typedoc
							function(request) {
								var typedocPattern = /^(?:(.+)\/)?local\/doc\/typedoc\/src\/(.*)/;
								var match = typedocPattern.exec(request.path);
								if (match) {
									var src = (match[1]) ? base.getSubdirectory(match[1]) : base;
									return asTextHandler({
										loader: new jsh.file.Loader({ directory: src }),
										index: "index.html"
									})($api.Object.compose(request, { path: match[2] }))
								}
							},
							function(request) {
								var typedocPattern = /^(?:(.+)\/)?local\/doc\/typedoc\/update/;
								var match = typedocPattern.exec(request.path);
								if (match) {
									var src = (match[1]) ? base.getSubdirectory(match[1]) : base;
									if (match[1]) {
										var response = synchronousUpdate(src);
										if (response) return response;
										return {
											status: { code: 200 },
											body: {
												type: "text/plain",
												string: "Ran TypeDoc successfully."
											}
										};
									} else {
										updater.update();
										return {
											status: { code: 200 },
											body: {
												type: "text/plain",
												string: "Updated updater."
											}
										};
									}
								}
							},
							function(request) {
								var typedocPattern = /^(?:(.+)\/)?local\/doc\/typedoc\/((.*)\.html$)/;
								var match = typedocPattern.exec(request.path);
								if (match) {
									var src = (match[1]) ? base.getSubdirectory(match[1]) : base;
									var output = src.getRelativePath("local/doc/typedoc");
									if (!output.directory || configuration.watch) {
										var response = synchronousUpdate(src);
										if (response) return response;
									}
									jsh.shell.console("Serving: " + request.path);
									return httpd.Handler.Loader({
										loader: new jsh.file.Loader({ directory: src.getSubdirectory("local/doc/typedoc") }),
										index: "index.html"
									})($api.Object.compose(request, { path: match[2] }))
								}
							},
							function(request) {
								var typedocPattern = /^(?:(.+)\/)?local\/doc\/typedoc\/(.*)/;
								var match = typedocPattern.exec(request.path);
								if (match) {
									var loader = new jsh.file.Loader({
										directory: base,
										type: function(file) {
											if (/\.svg$/.test(file.toString())) return "image/svg+xml";
											return jsh.io.mime.Type.fromName(file.toString());
										}
									});
									var handler = httpd.Handler.Loader({ loader: loader });
									return handler(request);
								}
							}
						),
						destroy: function() {
							updater.stop();
						}
					}
				}
			}
		)
	}
//@ts-ignore
)($api,jsh,$loader,$export);
