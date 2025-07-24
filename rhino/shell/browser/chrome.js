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
	 * @param { slime.jrunscript.shell.browser.internal.chrome.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jrunscript.shell.browser.internal.chrome.Exports> } $export
	 */
	function(Packages,$api,$context,$loader,$export) {
		if (!$context.os) throw new Error("No $context.os");
		if (!$context.os.process) throw new Error("No $context.os.process");
		if (!$context.os.process.list) throw new Error("No $context.os.process.list");

		var log = $context.api.java.log.named("jrunscript.shell.browser.chrome");

		/** @type { slime.jrunscript.shell.browser.internal.chrome.InstanceConstructor } */
		var Instance = function(b,u) {
			//	TODO	not ideal to be loading script per-instance but worth it for now as part of larger refactor
			var ps = $loader.file("chrome-process.js", {
				os: $context.os,
				program: b.program,
				user: b.user
			});

			/** @type { (u: any) => u is slime.jrunscript.shell.browser.internal.chrome.DefaultConfiguration } */
			var isDefaultConfiguration = function(u) {
				return u["install"];
			};

			if (!isDefaultConfiguration(u) && u.location) {
				u.directory = u.location.createDirectory({
					exists: function(dir) {
						return false;
					},
					recursive: true
				});
			}

			var castToDirectory = function(p) {
				/** @type { (p: slime.jrunscript.file.Node) => p is slime.jrunscript.file.Directory } */
				var nodeIsDirectory = function(p) {
					return p.directory === true;
				}

				if (nodeIsDirectory(p)) return p;
				throw new Error("Unreachable.");
			}

			if (!u.directory) {
				u.directory = castToDirectory($context.TMPDIR.createTemporary({ directory: true }));
			}
			if (!u.directory.getFile("First Run")) {
				u.directory.getRelativePath("First Run").write("", { append: false });
			}
			//	This Stack Overflow question:
			//	http://superuser.com/questions/240522/how-can-i-use-a-proxy-in-a-single-chrome-profile
			//
			//	... seems to indicate that proxy settings are per-user rather than (for example) per-profile. Did not attempt to
			//	verify this but going to rely on it for the API.
			var Data = function(p) {
				var read = function(path) {
					return eval("(" + p.base.getFile(path).read(String) + ")");
				}

				var localState = (p.base.getFile("Local State")) ? read("Local State") : null;

				if (localState) {
					var ProfileData = function(p) {
						this.directory = p.base;
						this.name = p.name;
						this.data = p.data;

						this.read = function(path) {
							if (!p.base.getFile(path)) return null;
							return eval("(" + p.base.getFile(path).read(String) + ")");
						}
					};

					this.profiles = [];
					for (var x in localState.profile.info_cache) {
						this.profiles.push(new ProfileData({
							name: x,
							base: p.base.getSubdirectory(x),
							data: localState.profile.info_cache[x]
						}));
					}
				}
			};

			var pacserver;

			/** @type { (p: typeof slime.jrunscript.shell.browser.object.instance.CreatedConfiguration["proxy"]) => p is slime.jrunscript.shell.browser.old.ProxyTools } */
			var isOldProxyImplementation = function(p) {
				return p["Server"];
			}

			/**
			 *
			 * @param { string[] } args
			 * @param { { incognito?: boolean, profile?: string } } m
			 */
			var addProfileArguments = function(args,m) {
				if (u.directory) args.push("--user-data-dir=" + u.directory);
				if (!isDefaultConfiguration(u) && u.proxy) {
					var proxy = u.proxy;
					if (isOldProxyImplementation(proxy)) {
						pacserver = proxy.Server();
						pacserver.start();
						args.push("--proxy-pac-url=" + pacserver.url);
					} else {
						args.push("--proxy-pac-url=" + proxy.url);
					}
				}
				if (!isDefaultConfiguration(u) && u.hostrules) {
					var value = u.hostrules.join(",");
					Packages.java.lang.System.err.println("hostrules = " + value);
					args.push("--host-resolver-rules=" + value);
				}
				if (!isDefaultConfiguration(u) && u.devtools) args.push("--auto-open-devtools-for-tabs");
				if (m.profile) args.push("--profile-directory=" + m.profile);
				if (m.incognito) args.push("--incognito");
			};

			var isRunning = function() {
				return ps.isRunning(u.directory);
			}

			/**
			 *
			 * @param { slime.jrunscript.shell.browser.object.RunArguments } m
			 */
			var launch = function(m) {
				log.FINE("Launching Chrome browser.");
				log.FINEST("$context.os = " + $context.os);
				log.FINER("$context.os.name = " + $context.os.name);
				if ($context.os.name == "Mac OS X") {
					log.FINE("Ensure default user is running ...");
					(function startDefaultUser() {
						var isDefaultRunning = function() {
							return ps.isDefaultRunning();
						}
						if (b.user && !isDefaultRunning()) {
							Packages.java.lang.System.err.println("Starting background Chrome ...");
							$context.run({
								command: "open",
								arguments: ["-a", "Google Chrome", "--args", "--no-startup-window"]
							});
							while(!isDefaultRunning()) {
								Packages.java.lang.Thread.currentThread().sleep(100);
							}
							Packages.java.lang.System.err.println("Started background Chrome ...");
						}
					})();
				}
				var args = [];
				addProfileArguments(args,m);
				var disableGpu = (function() {
					if (typeof(m.disableGpu) != "undefined") return m.disableGpu;
					//	TODO	document this
					return $context.environment.JSH_HOST_RHINO_SHELL_BROWSERS_CHROME_DISABLE_GPU;
				})();
				if (disableGpu) {
					args.push("--disable-gpu");
				}
				if (m.debug && m.debug.port) {
					args.push("--remote-debugging-port=" + m.debug.port);
				}
				if (m.arguments) {
					args.push.apply(args,m.arguments);
				}
				var isDocker = $api.fp.Thunk.value(
					"/.dockerenv",
					$context.api.file.Location.from.os,
					$context.api.file.Location.file.exists.simple
				)
				if ($context.USER == "root" || isDocker()) {
					args.push("--no-sandbox");
				}
				if (m.app) {
					if (m.position || m.size) {
						var script = [];
						if (m.position) {
							script.push("window.moveTo(" + m.position.x + "," + m.position.y + ");");
						}
						if (m.size) {
							script.push("window.resizeTo(" + m.size.width + "," + m.size.height + ");");
						}
						script.push("window.location = '" + m.app + "';");
						args.push("--app=data:text/html,<html><body><script>" + script.join("") + "</script></body></html>");
					} else {
						args.push("--app=" + m.app);
						//	TODO	no combination of these things seems to work, although it may work for "new" browser profiles;
						//			see http://stackoverflow.com/questions/13436855/launch-google-chrome-from-the-command-line-with-specific-window-coordinates
						// if (m.position || m.size) {
						// 	args.push("--chrome-frame");
						// }
						// if (m.position) {
						// 	args.push("--window-position=" + m.position.x + "," + m.position.y);
						// }
						// if (m.size) {
						// 	args.push("--window-size=" + m.size.width + "," + m.size.height);
						// }
					}
				} else {
					if (m.newWindow) {
						args.push("--new-window");
					}
					if (m.uri) {
						args.push(m.uri);
					} else if (m.uris) {
						args.push.apply(args,m.uris);
					}
				}
				log.FINE("Running program: " + b.program + " with args " + JSON.stringify(args));
				//Packages.java.lang.System.err.println("using program: args = " + JSON.stringify(args));
				//	TODO	use events rather than on.start property
				$context.run({
					command: b.program,
					arguments: args,
					stdio: m.stdio,
					on: {
						//	TODO	on.start is deprecated
						start: function(p) {
							log.FINE("Program " + b.program + " started.");
							if ($context.os.name == "Mac OS X" && m.exitOnClose) {
								//	TODO: The exitOnClose property is currently undocumented; it is not clear that it works correctly. More
								//	testing needed
								$context.api.java.Thread.start(function() {
									var state;
									var running = true;
									while(running) {
										var ps = $context.os.process.list();
										var processes = ps.filter(function(item) {
											return item.parent.id == p.pid;
										});
										var renderers = processes.filter(function(item) {
											return item.command.indexOf("--type=renderer") != -1 && item.command.indexOf("--extension-process") == -1;
										});
										//	TODO	recent change to Chrome architecture; opening window seems to cause creation of
										//			two renderer processes, closing seems to destroy one
										if (renderers.length > 1) {
											state = true;
										}
										try {
											if (state && renderers.length <= 1) {
												//	TODO	check to see whether it is still running
												try {
													p.kill();
												} catch (e) {
													//	probably was no longer running
												}
												running = false;
											} else {
												Packages.java.lang.Thread.sleep((state) ? 1000 : 100);
											}
										} catch (e) {
										}
									}
								});
							}
							if (m.on && m.on.start) {
								m.on.start.call(m,p);
							}
						}
					}
				});
				log.FINE("Program " + b.program + " terminated.");
				if (m.on && m.on.close) {
					m.on.close.call(m);
				}
				if (pacserver) {
					pacserver.stop();
				}
			}

			//	TODO	Presumably only works on OS X
			/**
			 *
			 * @param { slime.jrunscript.shell.browser.object.RunArguments } m
			 */
			var open = function(m) {
				if ($context.os.name == "Mac OS X") {
					var args = /** @type { string[] } */([]);
					args.push("-b","com.google.Chrome");
					if (m.uri) {
						args.push(m.uri);
					} else if (m.uris) {
						args.push.apply(args,m.uris);
					}
					args.push("--args");
					addProfileArguments(args,m);
					//Packages.java.lang.System.err.println("using open: args = " + JSON.stringify(args));
					$context.run({
						command: "/usr/bin/open",
						arguments: args
					});
				} else {
					//	TODO	Could consider having this API block until process was started and then return it
					$context.api.java.Thread.start({
						call: function() {
							launch(m);
						}
					});
				}
			};

			var Profile = function(data) {
				this.directory = data.directory;
				this.id = data.name;
				this.name = data.data.name;

				this.bookmarks = data.read("Bookmarks");

				this.preferences = data.read("Preferences");

				if (isDefaultConfiguration(u)) {
					this.open = function(m) {
						if (isRunning()) {
							//	On OS X, if we do not use "launch," the tabs open in the profile last used, regardless of the arguments
							//	sent to the program
							launch($api.Object.compose(m, {
								profile: data.name,
								//	nokill causes a thread that monitors the process list and waits for the browser window to be closed
								//	not to be launched
								nokill: true
							}));
						} else {
							open($api.Object.compose(m, {
								profile: data.name
							}));
						}
					}
				}
			}

			var data = new Data({ base: u.directory });
			Object.defineProperty(this, "profiles", {
				get: $api.fp.impure.Input.memoized(function() {
					return data.profiles.map(function(profile) {
						return new Profile(profile);
					});
				})
			});

			this.directory = u.directory;

			if (isDefaultConfiguration(u)) {
				this.open = function(m) {
					open(m);
				}
			} else {
				this.run = function(m) {
					launch(m);
				};

				this.launch = function(m) {
					//	TODO	duplicated above, in open()
					$context.api.java.Thread.start({
						call: function() {
							launch(m);
						}
					});
				};
			}

		}

		/**
		 *
		 * @param { { program: slime.jrunscript.file.File, user?: slime.jrunscript.file.Directory }} b
		 */
		var Chrome = function(b) {
			this.toString = function() {
				return "Google Chrome: " + b.program + " user=" + b.user;
			}

			this.program = String(b.program);

			this.version = void(0);
			Object.defineProperty(this, "version", {
				get: function() {
					var rv = $context.run({
						command: b.program,
						arguments: ["--version"],
						stdio: {
							output: String
						}
					}).stdio.output.split("\n")[0];
					var trailingWhitespace = /(.*)(?:\s+)$/;
					if (trailingWhitespace.test(rv)) {
						rv = trailingWhitespace.exec(rv)[1];
					}
					return rv;
				},
				enumerable: true
			});

			//	Used to be called "User" but "Instance" seems a better name (so as not to be confused with a
			//	"profile" (which is called a "person" by Chrome, although it used to be called a "user"). The term "install"
			//	wouldn't be perfect because then one Chrome codebase could be multiple "installs" (user data directories).
			//
			//	See https://www.chromium.org/user-experience/user-data-directory
			//	See https://www.chromium.org/user-experience/multi-profiles
			/**
			 * @type { slime.jrunscript.shell.browser.object.Chrome["Instance"]}
			 */
			this.Instance = (
				/**
				 * @param { slime.jrunscript.shell.browser.object.instance.CreatedConfiguration } u
				 * @constructor
				 */
				function(u) {
					return new Instance(b, u);
				}
			);
			this.User = $api.deprecate(this.Instance);

			if (b.user) {
				this.instance = new Instance(b, {
					directory: b.user,
					install: true
				});
				this.user = this.instance;
				$api.deprecate(this,"user");
			}
		}

		function getMajorVersion(chrome) {
			var pattern = /Google Chrome (\d+)(.*)$/;
			var match = pattern.exec(chrome.version);
			if (match) {
				return Number(match[1]);
			}
			throw new TypeError("Could not determine Chrome version from version string: " + chrome.version);
		}

		var installed = (
			function() {
				if ($context.os.name == "Mac OS X") {
					if ($context.api.file.Pathname("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome").file) {
						return new Chrome({
							program: $context.api.file.Pathname("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome").file,
							user: $context.HOME.getSubdirectory("Library/Application Support/Google/Chrome")
						});
					}
				}

				if ($context.os.name == "Linux") {
					if ($context.api.file.Pathname("/opt/google/chrome/chrome").file) {
						return new Chrome({
							program: $context.api.file.Pathname("/opt/google/chrome/chrome").file,
							user: $context.HOME.getSubdirectory(".config/google-chrome")
						});
					}

					if ($context.api.file.Pathname("/usr/bin/chromium").file) {
						return new Chrome({
							program: $context.api.file.Pathname("/usr/bin/chromium").file,
							user: $context.HOME.getSubdirectory(".config/chromium")
						});
					}
				}
			}
		)();

		$export({
			getMajorVersion: getMajorVersion,
			installed: installed,
			test: {
				Installation: function(p) {
					return new Chrome({
						program: $context.api.file.Pathname(p.program).file,
						user: (p.user) ? $context.api.file.Pathname(p.user).directory : null
					});
				}
			}
		});
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$export);
