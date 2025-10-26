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
		/** @type { (specified: slime.jrunscript.file.Pathname) => slime.$api.fp.impure.Input<slime.jrunscript.file.Pathname> } */
		var configureBuiltShellLocation = function(specified) {
			return $api.fp.impure.Input.memoized(function() {
				if (specified) return specified;
				var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });
				var rv = tmp.pathname;
				tmp.remove();
				return rv;
			});
		};

		/** @type { (src: slime.jrunscript.file.Directory) => (shell: slime.jrunscript.file.Directory) => any } */
		var getShellDataFromScript = function(src) {
			return function(shell) {
				return jsh.shell.jsh({
					shell: shell,
					script: src.getFile("jrunscript/jsh/test/jsh-data.jsh.js"),
					stdio: {
						output: String
					},
					/** @type { (p: slime.jsh.shell.oo.ForkResult) => any } */
					evaluate: function(result) {
						return JSON.parse(result.stdio.output);
					}
				});
			}
		};

		/** @type { (src: slime.jrunscript.file.Directory) => slime.$api.fp.impure.Output<slime.jrunscript.file.Directory> } */
		var configureTomcatInstallIntoShell = function(src) {
			return function(shell) {
				jsh.shell.jsh({
					shell: shell,
					script: src.getFile("jrunscript/jsh/tools/install/tomcat.jsh.js")
				})
			}
		};

		/** @type { (src: slime.jrunscript.file.Directory, executable: boolean, tomcat: boolean) => slime.$api.fp.impure.Output<slime.jrunscript.file.Pathname> } */
		var configureShellBuild = function(src, executable, tomcat) {
			var installTomcatToShell = configureTomcatInstallIntoShell(src);

			return function(location) {
				jsh.shell.jsh({
					shell: jsh.shell.jsh.src,
					script: src.getFile("jrunscript/jsh/etc/build.jsh.js"),
					arguments: [
						location,
						"-notest",
						"-nodoc"
					].concat(
						(jsh.internal.api.rhino.compatible()) ? ["-engine", "rhino"] : []
					).concat(
						(executable) ? ["-executable"] : []
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

				if (tomcat) {
					installTomcatToShell(location.directory);
				}
			}
		}

		/**
		 *
		 * @param { slime.project.internal.jrunscript_environment.Argument } p
		 */
		var Environment = function(p) {
			if (!p.src.getSubdirectory("contributor")) {
				throw new Error("p.src is " + p.src);
			}

			var getShellData = getShellDataFromScript(p.src);

			var getBuiltShellLocation = configureBuiltShellLocation(p.home);

			var buildShell = configureShellBuild(p.src, p.executable, p.tomcat);

			var installTomcatToShell = configureTomcatInstallIntoShell(p.src);

			var getHome = $api.fp.impure.Input.map(
				getBuiltShellLocation,
				$api.fp.impure.tap(function(location) {
					if (!location.directory) {
						buildShell(location);
						if (p.tomcat) {
							jsh.shell.console("Installing Tomcat into built shell ...");
							installTomcatToShell(location.directory);
						}
					}
				}),
				$api.fp.property("directory")
			)

			this.jsh = new function() {
				this.src = p.src;

				var rhino = (jsh.internal.api.rhino.compatible() && typeof(Packages.org.mozilla.javascript.Context) == "function") ? jsh.internal.api.rhino.compatible() : null;

				if (!jsh.shell.environment.SLIME_UNIT_JSH_UNBUILT_ONLY) this.built = (
					function() {
						var rv = {};

						Object.defineProperty(rv, "location", {
							get: getBuiltShellLocation,
							enumerable: true
						});

						Object.defineProperty(rv, "home", {
							get: getHome,
							enumerable: true
						});

						Object.defineProperty(rv, "data", {
							get: $api.fp.impure.Input.memoized(
								$api.fp.impure.Input.from.mapping({
									mapping: getShellData,
									argument: getHome()
								})
							),
							enumerable: true
						});

						rv.requireTomcat = function() {
							if (!this.home.getSubdirectory("lib/tomcat")) {
								installTomcatToShell(this.home);
							}
						};

						return rv;
					}
				)();

				this.unbuilt = new function() {
					this.src = p.src;

					this.lib = p.src.getRelativePath("local/jsh/lib").createDirectory({
						exists: function(dir) {
							return false;
						}
					});

					Object.defineProperty(this, "data", {
						get: $api.fp.impure.Input.memoized(
							$api.fp.impure.Input.from.mapping({
								mapping: getShellData,
								argument: p.src
							})
						),
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
