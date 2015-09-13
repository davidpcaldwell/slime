//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the rhino/shell SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var Chrome = function(b) {
	this.toString = function() {
		return "Google Chrome: " + b.program + " user=" + b.user;
	}

	this.User = function(u) {
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
				};
			}
		};

		var addProfileArguments = function(args,m) {
			if (u.directory) args.push("--user-data-dir=" + u.directory);
			if (m.profile) args.push("--profile-directory=" + m.profile);
		};

		var isRunning = function() {
			return u.directory.list().filter(function(node) {
				return node.pathname.basename == "RunningChromeVersion";
			}).length > 0;
		}

		//	TODO	Presumably only works on OS X
		var open = function(m) {
			var args = [];
			args.push("-b","com.google.Chrome");
			args.push(m.uri);
			args.push("--args");
			addProfileArguments(args,m);
			//Packages.java.lang.System.err.println("using open: args = " + JSON.stringify(args));
			$context.run({
				command: "/usr/bin/open",
				arguments: args
			});
		};

		var launch = function(m) {
			if ($context.os.name == "Mac OS X") {
				(function startDefaultUser() {
					var isDefaultRunning = function() {
						return b.user.list().filter(function(node) {
							return node.pathname.basename == "RunningChromeVersion";
						}).length > 0;
					}
					if (!isDefaultRunning()) {
						Packages.java.lang.System.err.println("Starting background Chrome ...");
						var tmp = $context.TMPDIR.createTemporary({ directory: true });
						var command = {
							command: b.program,
							arguments: ["--user-data-dir=" + b.user, "--no-startup-window"]
						};
						tmp.getRelativePath("chrome.bash").write(
							(
								[
									"nohup",
									command.command
								].concat(command.arguments)
								.concat(["&"])
							).map(function(token) {
								return token.toString().replace(/ /g, "\\ ");
							}).join(" "),
							{ append: false }
						);
						if (false) {
							$context.run({
								command: "/usr/bin/open",
								arguments: ["-b","com.google.Chrome","--args","--no-startup-window"]
							});
						} else {
							Packages.java.lang.System.err.println("script = " + tmp.getRelativePath("chrome.bash"));
							$context.run({
								command: "/bin/bash",
								arguments: [tmp.getRelativePath("chrome.bash")],
								directory: tmp
							});
						}
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
				return jsh.shell.environment.LOCAL_RHINO_SHELL_BROWSERS_CHROME_DISABLE_GPU;
			})();
			if (disableGpu) {
				args.push("--disable-gpu");
			}
			if (m.app) {
				args.push("--app=" + m.app);
			} else {
				args.push(m.uri);
			}
			//Packages.java.lang.System.err.println("using program: args = " + JSON.stringify(args));
			$context.run({
				command: b.program,
				arguments: args,
				on: {
					start: function(p) {
						if ($context.os.name == "Mac OS X") {
							$context.api.java.Thread.start(function() {
								var state;
								var running = true;
								while(running) {
									var ps = $context.os.process.list();
									var processes = ps.filter(function(item) {
										return item.parent.id == p.pid;
									});
									var renderers = processes.filter(function(item) {
										return item.command.indexOf("--type=renderer") != -1;
									});
									if (renderers.length) {
										state = true;
									}
									try {
										if (state && renderers.length == 0) {
											//	TODO	check to see whether it is still running
											try {
												p.kill();
											} catch (e) {
												//	probably was no longer running
											}
											running = false;
										} else {
											Packages.java.lang.Thread.currentThread().sleep((state) ? 1000 : 100);
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
		}

		var Profile = function(data) {
			this.directory = data.directory;
			this.id = data.name;
			this.name = data.data.name;

			this.bookmarks = data.read("Bookmarks");

			if (u.install) {
				this.open = function(m) {
					if (isRunning()) {
						launch($context.api.js.Object.set({}, m, {
							profile: data.name
						}));
					} else {
						open($context.api.js.Object.set({}, m, {
							profile: data.name
						}));
					}
				}
			}
		}

		var data = new Data({ base: u.directory });
		Object.defineProperty(this, "profiles", {
			get: $context.api.js.constant(function() {
				return data.profiles.map(function(profile) {
					return new Profile(profile);
				});
			})
		});

		this.directory = u.directory;

		if (u.install) {
			this.open = function(m) {
				open(m);
			}
		} else {
			this.run = function(m) {
				launch(m);
			};

			this.launch = function(m) {
				//	TODO	Could consider having this API block until process was started and then return it
				$context.api.java.Thread.start({
					call: function() {
						launch(m);
					}
				});
			};
		}
	};

	if (b.user) {
		this.user = new this.User({
			directory: b.user,
			install: true
		});
	}
}

if ($context.os.name == "Mac OS X") {
	if ($context.api.file.Pathname("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome").file) {
		$exports.chrome = new Chrome({
			program: $context.api.file.Pathname("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome").file,
			user: $context.HOME.getSubdirectory("Library/Application Support/Google/Chrome")
		});
	}
}
if ($context.os.name == "Linux") {
	if ($context.api.file.Pathname("/opt/google/chrome/chrome").file) {
		$exports.chrome = new Chrome({
			program: $context.api.file.Pathname("/opt/google/chrome/chrome").file,
			user: $context.HOME.getSubdirectory(".config/google-chrome")
		});
	}
}