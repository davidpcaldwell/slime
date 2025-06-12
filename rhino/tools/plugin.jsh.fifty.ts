//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export interface Tools {
		hg: slime.jrunscript.tools.hg.install.Exports

		/**
		 * Contains APIs for installing Git and obtaining the global Git installation. Also provides convenience methods for using
		 * the global installation, if one is present. See
		 * {@link slime.jrunscript.tools.git.Exports}. The `jsh` plugin adds the `jsh` property to the `credentialHelpers`
		 * property.
		 */
		git: slime.jrunscript.tools.git.Exports

		plugin: {
			jenkins: () => slime.jrunscript.tools.jenkins.Exports
		}
	}
}

namespace slime.jsh.java.tools {
	export interface Exports extends slime.jrunscript.java.tools.Exports {
		/** @deprecated */
		plugin: {
			/** @deprecated */
			hg: any
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;
			const scope = { api: jsh.tools }

			fifty.tests.jsapi = fifty.test.Parent();

			fifty.tests.jsapi._1 = function() {
				verify(1).is(1);
				verify(scope).api.hg.is.type("object");

				var distribution = scope.api.hg.distribution.osx({ os: "10.9.2" });
				//@ts-ignore
				verify(distribution).distribution.url.is("https://www.mercurial-scm.org/mac/binaries/Mercurial-3.4.2-py2.7-macosx10.9.zip");

				verify(scope.api.hg).evaluate(function() { return this.distribution.osx({ os: "10.3.2" }) }).threw.type(Error);

				//@ts-ignore
				verify(scope.api.hg).distribution.osx({ os: "10.16" }).distribution.url.is("https://www.mercurial-scm.org/mac/binaries/Mercurial-6.0.2-macosx10.15.pkg");
			}

			fifty.tests.jsapi._2 = function() {
				const { api } = scope;

				var Listener = function() {
					var events = [];

					this.console = function(e) {
						events.push(e);
					};

					this.received = function() {
						return events;
					}
				};

				var runInstall = function(p): { threw?: any, events?: slime.$api.Event<string>[] } {
					var listener = new Listener();
					var rv: { threw?: any, events?: any } = {};
					try {
						api.hg.install({ mock: p.mock }, listener);
					} catch(e) {
						rv.threw = e;
					}
					rv.events = listener.received();
					return rv;
				};

				(function alreadyInstalled() {
					var mock = {
						shell: {
							os: {
								name: "Mac OS X",
								version: "10.11"
							}
						},
						installed: { version: "4.0.1" }
					};
					var events = runInstall({ mock: mock }).events;
					verify(events).length.is.not(0);
					if (events.length > 0) {
						var last = events[events.length-1];
						verify(last).type.is("console");
						verify(last).detail.is("Already installed: hg 4.0.1");
					}
				})();

				(function upgrade() {
					var mock = {
						shell: {
							os: {
								name: "Mac OS X",
								version: "10.11"
							},
							run: function(p) {
								if (p.command == "open" && p.arguments.length == 1 && p.arguments[0].pathname.basename == "file.pkg") {
									return;
								} else {
									throw new Error();
								}
							}
						},
						install: {
							get: function(p) {
								return {
									pathname: {
										basename: "file.pkg"
									}
								};
							}
						},
						installed: { version: "3.4" }
					};
					var result = runInstall({ mock: mock });
					var events = result.events;
					var versions = events[1];
					verify(versions).type.is("console");
					verify(versions).detail.is("Found version: 3.4; upgrading to 4.0.1");
					verify(result).threw.is.type("object");
					verify(result).threw.evaluate(function() { return this instanceof TypeError; }).is(false);
					verify(result).threw.evaluate(function() { return this instanceof api.hg.install.GUI; }).is(true);
				})();

				var install = function(os,hg) {
					var mock = {
						shell: {
							os: {
								name: "Mac OS X",
								version: os
							},
							run: function(p) {
								if (p.command == "open" && p.arguments.length == 1 && p.arguments[0].pathname.basename == "file.pkg") {
									return;
								} else {
									throw new Error();
								}
							}
						},
						install: {
							get: function(p) {
								return {
									pathname: {
										basename: "file.pkg"
									}
								};
							}
						},
						installed: null
					};
					var result = runInstall({ mock: mock });
					var events = result.events;
					var versions = events[1];
					verify(versions).type.is("console");
					verify(versions).detail.is("Getting https://www.mercurial-scm.org/mac/binaries/Mercurial-" + hg + "-macosx" + os + ".pkg");
					verify(result).threw.is.type("object");
					verify(result).threw.evaluate(function() { return this instanceof TypeError; }).is(false);
					verify(result).threw.evaluate(function() { return this instanceof api.hg.install.GUI; }).is(true);
				};
				install("10.11","4.0.1");
				install("10.12","4.5.2");
			}

			fifty.tests.jsapi._3 = function() {
				const { $api } = fifty.global;
				const $context = { $slime: jsh.unit.$slime }

				var delegate: typeof fifty.$loader & { plugin: any } = Object.assign(fifty.$loader, { plugin: void(0) });
				delegate.plugin = {
					mock: function(configuration) {
						var $loader = (configuration.path) ? delegate.Child(configuration.path) : delegate;
						var plugins = (configuration.plugins) ? configuration.plugins : {};
						var scope = (function() {
							if (!configuration.global && !configuration.jsh) return {};
							if (configuration.global && configuration.jsh) {
								return $api.Object.compose(configuration.global, { jsh: configuration.jsh });
							}
							if (configuration.global) return configuration.global;
							if (configuration.jsh) return { jsh: configuration.jsh };
							throw new Error("Unreachable.");
						})();
						$context.$slime.plugins.mock({
							$loader: $loader,
							plugins: plugins,
							source: configuration.toString,
							global: scope,
							jsh: scope.jsh
						});
						var rv = {
							global: scope,
							jsh: scope.jsh,
							plugins: plugins
						};
						if (configuration.evaluate) {
							return configuration.evaluate(rv);
						} else {
							return rv;
						}
					}
				};

				var $jsapi = {
					loader: delegate
				}

				verify(jsh.tools.git).is.type("object");
				var mockjsh: Global = jsh.js.Object.set({}, jsh);
				mockjsh.tools = jsh.js.Object.set({}, mockjsh.tools);

				var MockFilePlugin = function(o?) {
					if (!o) o = {};
					if (!o.initial) o.initial = {};

					var Directory = function(o) {
					};

					var File = function(o) {
					};

					var getNode = function(s) {
						var elements = s.substring(1).split("/");
						var current = o.initial;
						for (var i=0; i<elements.length; i++) {
							if (current) {
								current = current[elements[i]];
							}
						}
						if (typeof(current) == "undefined") {
							return {};
						}
						if (typeof(current) == "object") {
							return new Directory(current);
						} else {
							return new File(current);
						}
					}

					this.Pathname = function(s) {
						var rv = {};
						Object.defineProperty(rv, "directory", {
							get: function() {
								var node = getNode(s);
								if (node instanceof Directory) return node;
								return null;
							}
						});

						Object.defineProperty(rv, "file", {
							get: function() {
								var node = getNode(s);
								if (node instanceof File) return node;
								return null;
							}
						});
						return rv;
					};

					this.Location = {
						file: {
							read: {
								string: {
									world: function(p) {
										return function(e) {
											return void(0);
										}
									}
								}
							}
						},
						parent: function() { return void(0); },
						directory: {
							require: {
								old: function(p) {

								}
							}
						}
					}
				};

				var MockShellPlugin = function(o) {
					this.os = {
						name: o.os.name
					};

					this.user = {};

					this.jsh = o.jsh;

					this.java = o.java;

					this.PATH = new function() {
						this.getCommand = function(s) {
							if (o.getPathCommand) return o.getPathCommand(s);
							return null;
						};
					};
				};

				verify(mockjsh).is.not(jsh);
				verify(mockjsh.js).is(jsh.js);
				verify(mockjsh.tools).is.not(jsh.tools);
				verify(mockjsh.tools.git,"mock jsh.tools.git").is(jsh.tools.git);

				var before = jsh.tools.git;

				$jsapi.loader.plugin.mock({
					path: "../../jrunscript/jsh/tools/install/",
					jsh: jsh
				});

				mockjsh.file = new MockFilePlugin();
				mockjsh.shell = new MockShellPlugin({
					os: {
						name: "Linux"
					}
				});
				var plugin = $jsapi.loader.plugin.mock({
					jsh: mockjsh,
					path: "git/",
					evaluate: function(p) {
						return p.jsh.tools.git;
					}
				});
				verify(jsh.tools.git,"jsh.tools.git").is(before);
				//@ts-ignore
				verify(plugin).is.not(before);
				verify(plugin).evaluate.property("installation").is(void(0));

				mockjsh.file = new MockFilePlugin({
					initial: {
						Applications: {
							"Xcode.app": {}
						}
					}
				});
				var d = mockjsh.file.Pathname("/Applications/Xcode.app");
				verify(d).is.type("object");
				verify(d).evaluate.property("directory").is.type("object");
				mockjsh.shell = new MockShellPlugin({
					os: {
						name: "Mac OS X"
					},
					getPathCommand: function(s) {
						if (s == "git") return {};
					},
					jsh: {
						src: {
							getRelativePath: function(r) {
							}
						}
					},
					java: {
						jrunscript: {}
					}
				});
				plugin = $jsapi.loader.plugin.mock({
					jsh: mockjsh,
					path: "git/",
					evaluate: function(p) {
						return p.jsh.tools.git;
					}
				});
				verify(plugin).evaluate.property("installation").is.type("object");
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			fifty.tests.jsh = function() {
				verify(jsh).tools.gcloud.is.type("object");
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.jsh);
				fifty.run(fifty.tests.jsapi);
			}
		}
	//@ts-ignore
	)(fifty);
}
