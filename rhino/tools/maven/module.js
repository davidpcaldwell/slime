//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.tools.maven.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.maven.Exports> } $export
	 */
	function($api,$context,$export) {
		var jsh = $context.jsh;

		/** @type { Partial<slime.jrunscript.tools.maven.Exports> } */
		var $exports = {};

		$exports.mvn = function(m) {
			var mvn = $context.mvn;
			var properties = (m.properties) ? (function() {
				var rv = [];
				for (var x in m.properties) {
					rv.push("-D" + x + "=" + m.properties[x]);
				}
				return rv;
			})() : [];
			var JAVA_HOME = (function() {
				if (m.java && m.java.home) return m.java.home;
				if ($context.java && $context.java.home) return $context.java.home;
				return jsh.shell.java.home;
			})();
			if (JAVA_HOME.pathname.basename == "jre") JAVA_HOME = JAVA_HOME.parent;
			return jsh.shell.run(jsh.js.Object.set({}
				,{
					command: mvn.pathname,
					arguments: properties.concat(m.arguments),
					environment: jsh.js.Object.set({}, jsh.shell.environment, {
						JAVA_HOME: JAVA_HOME
					}),
					directory: m.directory
				},
				(function() {
					if (m.evaluate) {
						return {
							stdio: {
								output: String
							},
							evaluate: function(result) {
								if (result.status != 0) {
									throw new Error("Exit status: " + result.status + " running " + result.command + " " + result.arguments.join(" ") + " in " + result.directory);
								}
								return m.evaluate(result.stdio.output);
							}
						}
					} else {
						return {
							stdio: {
								output: m.stdout,
								error: m.stderr
							}
						};
					}
				})()
			));
		};

		var Pom = function(file) {
			var xml = new jsh.document.Document({
				stream: file.read(jsh.io.Streams.binary)
			});

			this.xml = xml;

			var root = xml.document.getElement();

			if (root.element.type.name != "project") {
				throw new TypeError();
			}

			var getElementContent = function(parent,name) {
				var e = parent.child( jsh.document.filter({ elements: name }) );
				if (!e) throw new Error("Element " + parent + " has no child with name " + name);
				return e.children.map(function(item) {
					if (item.getString) return item.getString();
					if (item.comment) return "";
					throw new TypeError("Unknown content: " + item);
				}).join("");
			};

			var setElementContent = function(parent,name,value) {
				var e = parent.child( jsh.document.filter({ elements: name }) );
				e.children = [new jsh.js.document.Text({ text: value })];
			};

			this.getGroup = function() {
				if (!root.child(jsh.document.filter({ elements: "groupId" }))) {
					return parent.group;
				}
				return getElementContent(root,"groupId");
			}

			this.getArtifact = function() {
				return getElementContent(root,"artifactId");
			}

			this.getVersion = function() {
				var e = root.child( jsh.document.filter({ elements: "version" }) );
				if (!e) return null;
				return getElementContent(root,"version");
			}

			this.setVersion = function(version) {
				setElementContent(root,"version",version);
			}

			/** @returns { any[] & { one: any } } */
			this.getDependencies = function() {
				var filter = jsh.document.filter({ elements: "dependencies" });
				var filter2 = jsh.document.filter({ elements: "dependency" });
				var management = root.child(jsh.document.filter({ elements: "dependencyManagement" }));
				var declared = root.child( filter );
				var rv = [];
				if (declared) {
					rv = rv.concat(declared.children.filter(filter2));
				}
				if (management) {
					rv = rv.concat(management.child(filter).children.filter(filter2));
				}
				jsh.js.Array(rv).each(function() {
					/** @type { any } */
					var item = this;
					item.getGroup = function(v) {
						return getElementContent(this,"groupId");
					};
					item.getArtifact = function(v) {
						return getElementContent(this,"artifactId");
					};
					item.getVersion = function() {
						return getElementContent(this,"version");
					};
					item.setGroup = function(v) {
						setElementContent(this,"groupId",v);
					}
					item.setArtifact = function(v) {
						setElementContent(this,"artifactId",v);
					}
					item.setVersion = function(v) {
						if (!this.child(jsh.document.filter({ elements: "version" }))) {
							var e = new jsh.js.document.Element({ type: { name: "version" }});
							this.children.push(
								new jsh.js.document.Text({ text: "\n" }),
								e
							);
						}
						setElementContent(this,"version",v);
					}
				});
				//@ts-ignore
				return rv;
				// if (declared) return declared;
				// if (management) return management.child( filter );
				// return null;
			};

			this.getModules = function() {
				var modules = root.child(jsh.document.filter({ elements: "modules" }));
				if (!modules) return null;
				return modules.children.filter(function(child) {
					return child.element && child.element.type.name == "module";
				}).map(function(element) {
					return element.children[0].getString();
				});
			}

			// if (this.getDependencies()) {
			// 	this.getDependencies().children.forEach(function(item) {
			// 		if (item.element && item.element.type.name == "dependency") {
			// 			item.getGroup = function(v) {
			// 				return getElementContent(this,"groupId");
			// 			};
			// 			item.getArtifact = function(v) {
			// 				return getElementContent(this,"artifactId");
			// 			};
			// 			item.setGroup = function(v) {
			// 				setElementContent(this,"groupId",v);
			// 			}
			// 			item.setArtifact = function(v) {
			// 				setElementContent(this,"artifactId",v);
			// 			}
			// 			item.setVersion = function(v) {
			// 				setElementContent(this,"version",v);
			// 			}
			// 		}
			// 	});
			// }

			var parent = root.child( jsh.document.filter({ elements: "parent" }) );

			if (parent) {
				this.parent = new function() {
					this.toString = function() {
						return parent.toString();
					}

					var getElementContent = function(name) {
						var e = parent.child( jsh.document.filter({ elements: name }) );
						return e.children.map(function(item) {
							if (item.getString) return item.getString();
							if (item.comment) return "";
							throw new TypeError("Unknown content: " + item);
						}).join("");
					}

					this.group = getElementContent("groupId");
					this.artifact = getElementContent("artifactId");
					this.version = getElementContent("version");

					this.setVersion = function(version) {
						var e = parent.child( jsh.document.filter({ elements: "version" }) );
						e.children = [new jsh.js.document.Text({ text: version })];
						this.version = version;
					}
				}
			}

			this.toString = function() {
				return xml.toString();
			}

			this.write = function() {
				file.pathname.write(xml.toString(), { append: false });
			}
		};
		$exports.Pom = Pom;

		$exports.Project = function(p) {
			this.toString = function() {
				return "Maven project: " + p.base;
			}

			this.base = p.base;

			this.getModule = function(path) {
				var base = p.base.getSubdirectory(path);
				if (base && base.getFile("pom.xml")) {
					return new $exports.Project({
						base: base
					});
				}
				return null;
			}

			this.getModules = function() {
				if (this.pom.getModules()) {
					return this.pom.getModules().map(function(module) {
						return this.getModule(module);
					},this);
				} else {
					return null;
				}
			}

			this.mvn = function(m) {
				$exports.mvn(jsh.js.Object.set({}, {
					directory: p.base
				},m));
			};

			var Dependencies = function(p) {
				var list;

				if (p.list) {
					list = p.list.slice();
				}

				this.toString = function() {
					return jsh.js.toLiteral(list);
				}

				this.getVersion = function(p) {
					var versions = list.filter(function(item) {
						return item.group == p.group && item.artifact == p.artifact;
					}).map(function(item) {
						return item.version;
					});
					if (versions.length == 0) return null;
					if (versions.length > 1) throw new Error("Too many matches: " + versions.join(","));
					return versions[0];
				}
			};

			var getMavenArguments = function() {
				return (p.settings) ? ["-s", p.settings] : []
			}

			this.dependencies = new function() {
				this.resolve = $api.fp.impure.Input.memoized(function() {
					return $exports.mvn({
						directory: p.base,
						arguments: getMavenArguments().concat(["dependency:resolve"]),
						evaluate: function(s) {
							//	TODO	platform-dependent
							var lines = s.split("\n");
							var rv = [];
							var mode = {
								before: true
							};
							for (var i=0; i<lines.length; i++) {
								//	We only allow one of these lines
								if (mode.before && lines[i] == "[INFO] The following files have been resolved:") {
									mode.before = false;
									mode.during = true;
									continue;
								}
								if (mode.during) {
									//	TODO	figure this out
									//	Currently the nova archetype emits a project which has a six-token dependency:
									//	net.interactions.platform.nova:nova-annotation-processing:jar:jar-with-dependencies:1.6.0-SNAPSHOT:provided
									var parser = /^\[INFO\](?:\s+)(.+)\:(.+)\:(.+)\:(.+)\:(.+)$/;
									var match = parser.exec(lines[i]);
									//rv.push(lines[i]);
									if (match) {
										rv.push({
											group: match[1],
											artifact: match[2],
											//	match[3] is type? usually 'jar'
											version: match[4],
											scope: match[5]
										});
									} else {
										//	After we encounter a non-matching line we assume there are no more; this prevents modules
										//	from adding additional dependencies when they are processed
										//	TODO	find a better way; can we prevent traversal to modules?
										mode.during = false;
									}
								}
							}
							return rv;
						}
					});
				});

				this.on = function(p) {
					return jsh.js.Array.choose(this.resolve(), function(dependency) {
						return dependency.group == p.group && dependency.artifact == p.artifact;
					});
				};

				this.get = function(p) {
					return self.pom.getDependencies().one(function() {
						return this.getGroup() == p.group && this.getArtifact() == p.artifact;
					});
		//			return jsh.js.Array.choose(this.resolve(), function(dependency) {
		//				return dependency.group == p.group && dependency.artifact == p.artifact;
		//			});
				};

				this.set = function(p) {
					if (!self.pom.getDependencies()) throw new Error("No dependencies: " + self.base);
					var target = self.pom.getDependencies().one(function() {
						return this.getGroup && this.getGroup() == p.group && this.getArtifact() == p.artifact;
					});
					if (target) {
						target.setVersion(p.version);
					} else {
						debugger;
						throw new Error("Unimplemented: add dependency " + p.group + ":" + p.artifact + ":" + p.version);
					}
				}

				this.remove = function(p) {

				}
			};

			var self = this;

			if (!p.base) {
				throw new Error("No base specified for project.");
			}
			if (!p.base.getFile("pom.xml")) {
				throw new Error("POM not found at " + p.base.getRelativePath("pom.xml"));
			}
			this.pom = new Pom(p.base.getFile("pom.xml"));

			this.getVersion = function() {
				if (this.pom.getVersion() !== null) {
					return this.pom.getVersion();
				} else if (this.pom.parent) {
					return this.pom.parent.version;
				} else {
					throw new Error("No version.");
				}
			}
		};

		var LocalRepository = function(p) {
			this.resolve = function(dependency) {
				return p.directory.getFile(dependency.group.replace(/\./g, "/") + "/" + dependency.artifact + "/" + dependency.version + "/" + dependency.artifact + "-" + dependency.version + ".jar");
			}
		}

		$exports.Repository = function(p) {
		};
		if ($context.HOME.getSubdirectory(".m2/repository")) {
			$exports.Repository.LOCAL = new LocalRepository({ directory: $context.HOME.getSubdirectory(".m2/repository") });
		}

		/** @type { (version: string) => slime.jrunscript.tools.install.Distribution } */
		var getDistribution = function(version) {
			//	3.0.4 and up
			var BASE = "https://archive.apache.org/dist/maven/maven-3/";

			var url = BASE + version + "/binaries/apache-maven-" + version + "-bin.tar.gz";
			return $context.library.install.Distribution.from.file({
				url: url,
				prefix: function(distribution) {
					return "apache-maven-" + version;
				}
			});
		}

		var Installation = {
			/** @type { slime.jrunscript.tools.maven.exports.Installation["exists"]["world"] } */
			exists: $api.fp.world.api.single(
				$api.fp.pipe(
					$api.fp.property("argument"),
					$api.fp.property("home"),
					$context.library.file.Location.from.os,
					$context.library.file.Location.directory.exists.simple
				)
			),
			/** @type { slime.jrunscript.tools.maven.exports.Installation["version"]["world"] } */
			version: $api.fp.world.api.single(
				function(p) {
					var program = $api.fp.now.map(
						p.argument.home,
						$context.library.file.Location.from.os,
						$context.library.file.Location.directory.relativePath("bin/mvn")
					);
					/** @type { slime.jrunscript.shell.run.Intention } */
					var intention = {
						command: program.pathname,
						arguments: ["--version"],
						environment: function(existing) {
							return $api.Object.compose(existing, { JAVA_HOME: $context.library.shell.java.home.pathname.toString() })
						},
						stdio: {
							output: "string"
						}
					};
					var result = $api.fp.world.Sensor.now({
						sensor: $context.library.shell.subprocess.question,
						subject: intention
					});
					if (result.status) throw new Error("mvn exit status: " + result.status);
					return $api.fp.now.map(
						result.stdio.output,
						$api.fp.string.split("\n"),
						$api.fp.property(0),
						$api.fp.RegExp.exec(/Apache Maven (.*) \(.*$/),
						$api.fp.Maybe.map(function(match) { return match[1]; }),
						$api.fp.Maybe.else(function() { throw new Error("Cannot parse: " + result.stdio.output) })
					);
				}
			),
			/** @type { slime.jrunscript.tools.maven.exports.Installation["require"]["world"] } */
			require: $api.fp.world.api.single(
				function(p) {
					var exists = $api.fp.world.Sensor.now({ sensor: Installation.exists, subject: p.argument.installation });
					if (exists) {
						var version = $api.fp.world.Sensor.now({ sensor: Installation.version, subject: p.argument.installation });
						p.events.fire("found", { version: version });
						if (version != p.argument.version) {
							var accept = p.argument.accept && p.argument.accept(version);
							if (!accept) {
								$api.fp.now.map(
									p.argument.installation.home,
									$context.library.file.Location.from.os,
									$context.library.file.Location.remove.simple
								);
							} else {
								return;
							}
						} else {
							return;
						}
					}

					var distribution = getDistribution(p.argument.version);

					$api.fp.world.Means.now({
						means: $context.library.install.Distribution.install.world,
						order: { download: distribution, to: p.argument.installation.home }
					});
					p.events.fire("installed", { version: p.argument.version });
				}
			)
		}

		$export({
			Installation: {
				exists: {
					world: Installation.exists
				},
				version: {
					world: Installation.version
				},
				require: {
					world: Installation.require
				}
			},
			mvn: $exports.mvn,
			Pom: $exports.Pom,
			Project: $exports.Project,
			Repository: $exports.Repository
		});
	}
//@ts-ignore
)($api,$context,$export);
