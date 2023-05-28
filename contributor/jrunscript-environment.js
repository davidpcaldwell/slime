//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global & { test: any } } jsh
	 * @param { slime.loader.Export<slime.project.internal.jrunscript_environment.Exports> } $export
	 */
	function(Packages,$api,jsh,$export) {
		/**
		 *
		 * @param { slime.project.internal.jrunscript_environment.Argument } p
		 */
		var Environment = function(p) {
			if (!p.src.getSubdirectory("contributor")) {
				throw new Error("p.src is " + p.src);
			}
			//	p.src (directory): source code of shell
			//	p.home (Pathname): location of built shell
			//	p.noselfping (boolean): if true, host cannot ping itself
			this.jsh = new function() {
				var getData = function(shell) {
					return jsh.shell.jsh({
						shell: shell,
						script: p.src.getFile("jrunscript/jsh/test/jsh-data.jsh.js"),
						stdio: {
							output: String
						},
						evaluate: function(result) {
							return JSON.parse(result.stdio.output);
						}
					});
				};

				this.src = p.src;

				var rhino = ((jsh.shell.jsh.lib.getFile("js.jar") && typeof(Packages.org.mozilla.javascript.Context) == "function")) ? jsh.shell.jsh.lib.getFile("js.jar") : null;

				//	TODO	we would like to memoize these functions, but what happens if a memoized function throws an error?

				var unbuilt;
				var built;

				if (!jsh.shell.environment.SLIME_UNIT_JSH_UNBUILT_ONLY) this.built = new function() {
					var getLocation = function() {
						if (!p.home) {
							var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });
							p.home = tmp.pathname;
							tmp.remove();
						}
						return p.home;
					}

					var getHome = function() {
						getLocation();
						if (!p.home.directory) {
							jsh.shell.jsh({
								shell: jsh.shell.jsh.src,
								script: p.src.getFile("jrunscript/jsh/etc/build.jsh.js"),
								arguments: [
									p.home,
									"-notest",
									"-nodoc"
								].concat(
									(jsh.shell.jsh.lib.getFile("js.jar")) ? ["-rhino", jsh.shell.jsh.lib.getFile("js.jar").pathname] : []
								).concat(
									(p.executable) ? ["-executable"] : []
								),
								environment: $api.Object.compose(
									jsh.shell.environment,
									(jsh.shell.jsh.lib) ? {
										JSH_SHELL_LIB: jsh.shell.jsh.lib.toString()
									} : {}
								)
								// TODO: below was from previous verify.jsh.js; is it helpful? On Windows, maybe? Looks like no-op
								// environment: jsh.js.Object.set({
								// 	//	TODO	next two lines duplicate logic in jsh.test plugin
								// 	TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
								// 	PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
								// 	PATH: jsh.shell.environment.PATH.toString()
								// })
							});
							if (p.tomcat) {
								jsh.shell.console("Installing Tomcat into built shell ...");
								jsh.shell.jsh({
									shell: p.home.directory,
									script: p.src.getFile("jrunscript/jsh/tools/install/tomcat.jsh.js")
								});
							}
						}
						return p.home.directory;
					}

					Object.defineProperty(this, "location", {
						get: function() {
							return getLocation();
						},
						enumerable: true
					});

					this.home = void(0);

					Object.defineProperty(this, "home", {
						get: function() {
							return getHome();
						},
						enumerable: true
					});

					Object.defineProperty(this, "data", {
						get: function() {
							if (!built) {
								built = getData(getHome());
							}
							return built;
						},
						enumerable: true
					});

					this.requireTomcat = function() {
						if (!this.home.getSubdirectory("lib/tomcat")) {
							jsh.shell.jsh({
								shell: this.home,
								script: p.src.getFile("jsh/tools/install/tomcat.jsh.js")
							})
						}
					}
				};

				this.unbuilt = new function() {
					this.src = p.src;

					this.lib = p.src.getRelativePath("local/jsh/lib").createDirectory({
						exists: function(dir) {
							return false;
						}
					});

					Object.defineProperty(this, "data", {
						get: function() {
							if (!unbuilt) {
								unbuilt = getData(p.src);
							}
							return unbuilt;
						},
						enumerable: true
					});
				};

				var packagingShell = this.built;

				this.packaged = new function() {
					var shell;
					var data;

					var getShell = function() {
						if (!shell) {
							var to = jsh.shell.TMPDIR.createTemporary({ directory: true }).getRelativePath("packaged.jar");
							jsh.shell.jsh({
								shell: packagingShell.home,
								script: p.src.getRelativePath("jrunscript/jsh/tools/package.jsh.js").file,
								arguments: ([
									"-script", p.src.getRelativePath("jrunscript/jsh/test/jsh-data.jsh.js"),
									"-to", to
								]).concat( (!rhino) ? ["-norhino"] : [] )
							});
							shell = to.file;
						}
						return shell;
					};

					Object.defineProperty(this, "jar", {
						get: function() {
							return getShell();
						},
						enumerable: true
					});

					Object.defineProperty(this, "data", {
						get: function() {
							if (!data) {
								data = jsh.shell.java({
									jar: getShell(),
									stdio: {
										output: String
									},
									evaluate: function(result) {
										return JSON.parse(result.stdio.output);
									}
								});
								jsh.shell.console("Packaged data: " + JSON.stringify(data));
							}
							return data;
						},
						enumerable: true
					});
				};

				var BITBUCKET = false;

				if (BITBUCKET && jsh.httpd.Tomcat) this.remote = new function() {
					var data;

					var url = "http://bitbucket.org/" + "api/1.0/repositories/davidpcaldwell/slime/raw/local/";

					Object.defineProperty(this, "url", {
						get: function() {
							return url;
						}
					});

					// TODO: should this be allowed?
					var TRACE = false;

					var getMock = $api.fp.impure.Input.memoized(function() {
						jsh.loader.plugins(p.src.getRelativePath("jsh/test/launcher"));
						var mock = new jsh.test.launcher.MockRemote({
							src: {
								davidpcaldwell: {
									slime: {
										directory: jsh.shell.jsh.src
									}
								}
							},
							trace: false
						});
						jsh.shell.console("Mock port is " + mock.port);
						return mock;
					});

					Object.defineProperty(this, "data", {
						get: function() {
							if (!data) {
								var mock = getMock();
								var script = url + "jsh/test/jsh-data.jsh.js";
								data = mock.jsh({
									script: script,
									stdio: {
										output: String
									},
									evaluate: function(result) {
										return JSON.parse(result.stdio.output);
									}
								});
							}
							return data;
						},
						enumerable: true
					});

					this.jsh = function(p) {
						return getMock().jsh(p);
					}
				}
			}

			this.noselfping = p.noselfping;
		}

		$export(Environment);
	}
//@ts-ignore
)(Packages,$api,jsh,$export);
