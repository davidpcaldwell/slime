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

		/** @type { slime.js.Cast<slime.old.document.Element> } */
		var asElement = $api.fp.cast.unsafe;

		/** @type { slime.js.Cast<slime.old.document.Characters> } */
		var asCharacters = $api.fp.cast.unsafe;

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

		/** @type { slime.jrunscript.tools.maven.Exports["Pom"] } */
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
					throw new Error("How did the below ever work?");
					//return parent.group;
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
				var management = asElement(root.child(jsh.document.filter({ elements: "dependencyManagement" })));
				var declared = asElement(root.child( filter ));
				var rv = [];
				if (declared) {
					rv = rv.concat(declared.children.filter(filter2));
				}
				if (management) {
					rv = rv.concat(asElement(management.child(filter)).children.filter(filter2));
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
				/** @type { (node: slime.old.document.Node) => node is slime.old.document.Element } */
				var isElement = function(node) { return node["element"]; };

				var modules = asElement(root.child(jsh.document.filter({ elements: "modules" })));
				if (!modules) return null;
				return modules.children.filter(function(child) {
					return isElement(child) && child.element.type.name == "module";
				}).map(function(element) {
					if (!isElement(element)) throw new Error("Unreachable");
					return asCharacters(element.children[0]).getString();
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

			var parent = asElement(root.child( jsh.document.filter({ elements: "parent" }) ));

			if (parent) {
				this.parent = new function() {
					this.toString = function() {
						return parent.toString();
					}

					var getElementContent = function(name) {
						var e = asElement(parent.child( jsh.document.filter({ elements: name }) ));
						return e.children.map(function(item) {
							if (item["getString"]) return item["getString"]();
							if (item["comment"]) return "";
							throw new TypeError("Unknown content: " + item);
						}).join("");
					}

					this.group = getElementContent("groupId");
					this.artifact = getElementContent("artifactId");
					this.version = getElementContent("version");

					this.setVersion = function(version) {
						var e = asElement(parent.child( jsh.document.filter({ elements: "version" }) ));
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
			/** @type { slime.jrunscript.tools.maven.installation.Exports["exists"]["world"] } */
			exists: $api.fp.world.api.single(
				$api.fp.pipe(
					$api.fp.property("argument"),
					$api.fp.property("home"),
					$context.library.file.Location.from.os,
					$context.library.file.Location.directory.exists.simple
				)
			),
			/** @type { slime.jrunscript.tools.maven.installation.Exports["version"]["world"] } */
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
			/** @type { slime.jrunscript.tools.maven.installation.Exports["require"]["world"] } */
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
									$context.library.file.Location.remove({
										recursive: true
									}).simple
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
			shell: {
				Intention: function(p) {
					var project = $api.fp.now(p.intention.project, $context.library.file.Location.from.os);
					var projectIsDirectory = $api.fp.now(
						project,
						$context.library.file.Location.directory.exists.simple
					);
					var projectIsFile = $api.fp.now(
						project,
						$context.library.file.Location.file.exists.simple
					)
					return {
						command: $api.fp.now(p.installation.home, $context.library.file.os.directory.relativePath("bin/mvn")),

						//	See https://books.sonatype.com/mvnref-book/reference/running-sect-options.html
						arguments: $api.Array.build(function(it) {
							//	TODO	should be possible to implement all of this much more elegantly with Maybe
							//			and Stream and flatMap and so forth
							if (p.intention.properties) {
								Object.entries(p.intention.properties).forEach(function(entry) {
									it.push("--define", entry[0] + "=" + entry[1]);
								});
							}
							if (p.intention.repository) {
								it.push("--define", "maven.repo.local=" + p.intention.repository);
							}
							if (p.intention.profiles) {
								it.push("--activate-profiles", p.intention.profiles.join(","));
							}
							if (projectIsFile) {
								it.push("--file", p.intention.project);
							}
							if (p.intention.settings && p.intention.settings.user) {
								it.push("--settings", p.intention.settings.user);
							}
							if (p.intention.settings && p.intention.settings.global) {
								it.push("--global-settings", p.intention.settings.global);
							}
							if (p.intention.batchMode) {
								it.push("--batch-mode");
							}
							if (p.intention.debug) {
								it.push("--debug");
							}
							it.push.apply(it, p.intention.commands);
						}),
						environment: function(existing) {
							return $api.Object.compose(
								existing,
								(p.javaHome) ? {
									JAVA_HOME: p.javaHome
								} : {}
							)
						},
						directory: (projectIsDirectory) ? p.intention.project : void(0),
						stdio: {
							output: "line",
							error: "line"
						}
					}
				}
			},
			xml: (
				function() {
					/** @type { (p: slime.jrunscript.tools.maven.xml.Element) => p is slime.jrunscript.tools.maven.xml.ParentElement } */
					var isParent = function(p) {
						return Boolean(p["children"]);
					};

					/** @type { (p: slime.jrunscript.tools.maven.xml.Element) => p is slime.jrunscript.tools.maven.xml.ValueElement } */
					var isValue = function(p) {
						return typeof p["value"] == "string";
					};

					/** @type { (p: slime.jrunscript.tools.maven.xml.Element) => p is slime.jrunscript.tools.maven.xml.VoidElement } */
					var isVoid = function(p) {
						return !isParent(p) && !isValue(p);
					}

					var getIndent = function(putativeIndentNode) {
						if ($context.library.document.Node.isString(putativeIndentNode)) {
							var data = putativeIndentNode.data;
							var lines = data.split("\n");
							return lines[lines.length-1];
						} else {
							throw new Error();
						}
					};

					/**
					 *
					 * @param { { parent: (document: slime.runtime.document.Document) => slime.runtime.document.Element, child: (parent: slime.runtime.document.Element) => slime.runtime.document.Element } } p
					 * @returns { slime.$api.fp.Mapping<slime.runtime.document.Document, { parent: slime.runtime.document.Element, child: slime.runtime.document.Element, index: number, indent: string }> }
					 */
					var getElementIndent = function(p) {
						return function(document) {
							var parent = p.parent(document);
							var child = p.child(parent);
							if (child === null) {
								return {
									parent: parent,
									child: null,
									index: null,
									indent: getIndent(parent.children[0])
								};
							} else {
								var index = parent.children.indexOf(child);
								if (index == -1) throw new Error();
								if (index == 0) throw new Error();
								var childIndent = getIndent(parent.children[index-1]);
								return {
									parent: parent,
									child: child,
									index: index,
									indent: childIndent
								};
							}
						}
					};

					/**
					 *
					 * @param { { indent: slime.jrunscript.tools.maven.xml.Indentation, xml: slime.jrunscript.tools.maven.xml.Element } } p
					 * @returns { slime.runtime.document.Element }
					 */
					var buildElement = function recurse(p) {
						/** @type { slime.$api.fp.Mapping<string,slime.runtime.document.Text> } */
						var text = function(string) {
							return {
								type: "text",
								data: string
							};
						};

						/** @type { slime.runtime.document.Element } */
						var rv = {
							type: "element",
							name: p.xml.name,
							attributes: (p.xml.attributes || []).map(function(attribute) {
								return {
									whitespace: " ",
									name: attribute.name,
									quote: "\"",
									value: attribute.value
								}
							}),
							selfClosing: isVoid(p.xml),
							children: [],
							endTag: Boolean(isVoid(p.xml)) ? ("") : ("</" + p.xml.name + ">")
						};
						var internalIndent = p.indent.position + p.indent.offset;
						if (isParent(p.xml)) {
							p.xml.children.forEach(function(child) {
								rv.children.push(text("\n" + internalIndent));
								rv.children.push(recurse({
									indent: {
										position: internalIndent,
										offset: p.indent.offset
									},
									xml: child
								}))
							})
							rv.children.push(
								/** @type { slime.runtime.document.Text } */ ({
									type: "text",
									data: "\n" + p.indent.position
								})
							);
						} else if (isValue(p.xml)) {
							rv.children.push(text(p.xml.value));
						}
						return rv;
					};

					return {
						getIndent: function(p) {
							return function(pom) {
								var document = $context.library.document.Document.codec.string.decode(pom);
								return getElementIndent(p)(document).indent;
							}
						},
						edit: {
							insert: {
								element: function(p) {
									return function(pom) {
										var document = $context.library.document.Document.codec.string.decode(pom);

										var configuration = getElementIndent({
											parent: p.parent,
											child: p.after
										})(document);

										var newElement = buildElement({
											indent: {
												position: configuration.indent,
												offset: p.indent
											},
											xml: p.element
										});

										/** @type { slime.runtime.document.Text } */
										var myIndent = { type: "text", data: $api.fp.string.repeat( p.lines || 0 )("\n") + "\n" + configuration.indent };

										configuration.parent.children.splice.apply(
											configuration.parent.children,
											[ (configuration.index == null) ? 0 : configuration.index+1, 0, myIndent, newElement]
										);

										return $context.library.document.Document.codec.string.encode(document);
									}
								}
							},
							replace: {
								with: {
									element: function(p) {
										return function(pom) {
											var document = $context.library.document.Document.codec.string.decode(pom);

											var configuration = getElementIndent({
												parent: p.parent,
												child: p.target
											})(document);

											if (configuration.index === null) throw new Error();

											var newElement = buildElement({
												indent: {
													position: configuration.indent,
													offset: p.indent
												},
												xml: p.element
											});

											configuration.parent.children[configuration.index] = newElement;

											return $context.library.document.Document.codec.string.encode(document);
										}
									}
								}
							},
							remove: {
								element: function(p) {
									return function(pom) {
										var document = $context.library.document.Document.codec.string.decode(pom);

										var configuration = getElementIndent({
											parent: p.parent,
											child: p.target
										})(document);

										if (configuration.index === null) throw new Error();

										configuration.parent.children.splice(configuration.index-1, 2);

										return $context.library.document.Document.codec.string.encode(document);
									}
								}
							}
						},
						Element: {
							value: {
								get: function(element) {
									if (element.children.length != 1) throw new Error("Expected exactly 1 child.");
									var child = element.children[0];
									if (!$context.library.document.Node.isString(child)) throw new Error("Expected child to be string.");
									return child.data;
								},
								set: function(value) {
									return function(element) {
										$context.library.document.Parent.content.text.set({ parent: element, data: value });
									}
								}
							}
						},
						build: {
							element: buildElement
						}
					};
				}
			)(),
			mvn: $exports.mvn,
			Pom: Pom,
			Project: $exports.Project,
			Repository: $exports.Repository
		});
	}
//@ts-ignore
)($api,$context,$export);
