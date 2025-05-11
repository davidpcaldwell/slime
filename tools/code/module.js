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
	 * @param { slime.tools.code.Context } $context
	 * @param { slime.loader.Export<slime.tools.code.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 *
		 * @param { slime.jrunscript.file.Location } repository
		 * @returns { (path: string) => slime.tools.code.File }
		 */
		function gitPathToFile(repository) {
			return function(path) {
				return {
					path: path,
					file: $context.library.file.Location.directory.relativePath(path)(repository)
				}
			}
		}

		var filename = {
			isText: function(basename) {
				//	Determines whether a file is text (true) or binary (false) by its name.
				//	https://fileinfo.com/ is a reasonable resource for checking whether file extensions are well-established.
				if (basename == ".DS_Store") return false;
				if (/\.txt$/.test(basename)) return true;

				if (/\.js$/.test(basename)) return true;
				if (/\.pac$/.test(basename)) return true;
				if (/\.ts$/.test(basename)) return true;
				if (/\.json$/.test(basename)) return true;

				if (/\.kts$/.test(basename)) return true;
				if (/\.gradle$/.test(basename)) return true;

				if (/\.html$/.test(basename)) return true;
				if (/\.java$/.test(basename)) return true;
				if (/\.scala$/.test(basename)) return true;
				if (/\.css$/.test(basename)) return true;
				if (/\.c$/.test(basename)) return true;
				if (/\.cpp$/.test(basename)) return true;
				if (/\.xml$/.test(basename)) return true;
				if (/\.properties$/.test(basename)) return true;
				if (/\.coffee$/.test(basename)) return true;
				if (/\.md/.test(basename)) return true;
				if (/\.wav$/.test(basename)) return false;
				if (/\.xls$/.test(basename)) return false;
				if (/\.xls$/.test(basename)) return false;
				if (/\.xlsx$/.test(basename)) return false;
				if (/\.numbers$/.test(basename)) return false;
				if (/\.hgrc$/.test(basename)) return true;
				if (/\.gitignore$/.test(basename)) return true;
				if (/\.dockerignore$/.test(basename)) return true;
				if (/Dockerfile$/.test(basename)) return true;
				if (/\.bashrc$/.test(basename)) return true;

				if (basename == ".hgignore") return true;
				if (basename == ".hgsubstate") return false;
				if (basename == ".hgsub") return true;
			},
			isVcsGenerated: function(name) {
				if (name == ".hgtags") return true;
				if (name == ".git") return true;
			},
			isIdeGenerated: function(name) {
				if (/\.iml$/.test(name)) return true;
			}
		};

		/**
		 *
		 * @type { slime.tools.code.Exports["directory"] }
		 */
		var directory = {
			isLocal: function(directory) { return directory.pathname.basename == "local"; },
			isVcs: function(directory) {
				var basename = directory.pathname.basename;
				return basename == ".git" || basename == ".hg" || basename == ".svn";
			},
			isBuildTool: function(directory) {
				var basename = directory.pathname.basename;
				return basename == ".gradle" || basename == "gradle" || basename == "build" || basename == "target";
			}
		}

		var defaults = {
			exclude: {
				file: $api.fp.pipe(
					function(file) { return file.pathname.basename; },
					$api.fp.Predicate.or(
						filename.isVcsGenerated,
						filename.isIdeGenerated
					)
				),
				directory: $api.fp.Predicate.or(
					function(directory) { return directory.pathname.basename == "node_modules" },
					directory.isLocal,
					directory.isVcs,
					directory.isBuildTool
				)
			}
		};

		/**
		 *
		 * @type { slime.tools.code.internal.functions["getDirectoryObjectSourceFiles"] }
		 */
		function getDirectoryObjectSourceFiles(p) {
			/** @type { slime.js.Cast<slime.jrunscript.file.File> } */
			var castToFile = $api.fp.cast.unsafe;

			/**
			 *
			 * @param { slime.$api.fp.Predicate<slime.jrunscript.file.File> } isExcludedFile
			 * @returns { slime.$api.fp.Predicate<slime.jrunscript.file.Node> }
			 */
			function isAuthoredTextFile(isExcludedFile) {
				return function(node) {
					if (node.directory) return false;
					if (isExcludedFile(castToFile(node))) return false;
					return true;
				}
			}

			/** @type { (file: slime.jrunscript.file.File) => slime.jrunscript.file.world.Location } */
			var toLocation = function(node) {
				return $context.library.file.world.Location.from.os(node.pathname.toString());
			}

			/**
			 *
			 * @param { { path: string, node: slime.jrunscript.file.Node } } p
			 * @returns { slime.tools.code.File }
			 */
			function nodeToSourceFile(p) {
				return {
					path: p.path,
					file: toLocation(castToFile(p.node))
				}
			}

			if (!p.base) throw new Error("Required: base, specifying directory.");
			return function(events) {
				return p.base.list({
					filter: isAuthoredTextFile( (p.exclude && p.exclude.file) ? p.exclude.file : defaults.exclude.file ),
					descendants: $api.fp.Predicate.not( (p.exclude && p.exclude.directory) ? p.exclude.directory : defaults.exclude.directory ),
					type: $context.library.file.list.ENTRY
				}).map(nodeToSourceFile).filter(
					$api.fp.series(
						p.isText,
						function(file) {
							events.fire("unknownFileType", file);
							return void(0);
						}
					)
				)
			};
		}

		/**
		 *
		 * @param { (p: slime.tools.code.File) => boolean | undefined } oldIsText
		 * @returns { (p: slime.tools.code.File) => slime.$api.fp.Maybe<boolean> }
		 */
		var updateIsText = function(oldIsText) {
			return function(file) {
				var old = oldIsText(file);
				if (typeof(old) == "boolean") return $api.fp.Maybe.from.some(old);
				return $api.fp.Maybe.from.nothing();
			}
		};

		/** @type { (p: slime.tools.code.isSource) => slime.tools.code.oldIsSource } */
		var downgradeIsSource = function(isSource) {
			return function(file) {
				return isSource(file.file);
			}
		};

		/**
		 *
		 * @type { slime.tools.code.internal.functions["getGitSourceFiles"] }
		 */
		function getGitSourceFiles(p) {
			return function(events) {
				//	We retrieve the Git source files in two steps, because the --others mechanism used to retrieve untracked files
				//	does not work recursively.

				var tracked = $context.library.git.program({ command: "git" })
					.repository(p.repository.pathname)
					.command($context.library.git.commands.lsFiles)
					.argument({ recurseSubmodules: p.submodules })
					.run()
				;

				/** @type { slime.jrunscript.tools.git.Command<void,string[]> } */
				var lsFilesOthers = {
					invocation: function() {
						return {
							command: "ls-files",
							arguments: ["--others", "--exclude-standard"]
						}
					},
					result: $context.library.git.commands.lsFiles.result
				};

				var untracked = $context.library.git.program({ command: "git" })
					.repository(p.repository.pathname)
					.command(lsFilesOthers)
					.argument()
					.run()
				;

				var listed = tracked.concat(untracked).map(gitPathToFile(p.repository)).filter(function(file) {
					//	Filter out files that do not exist, perhaps because they have been removed but the remove has not been
					//	committed, so they are still listed by ls-files
					return $api.fp.world.now.question(
						$context.library.file.Location.file.exists.world(),
						file.file
					);
				});

				var rv = [];
				for (var i=0; i<listed.length; i++) {
					var fileIsText = p.isSource(listed[i]);
					if (!fileIsText.present) {
						events.fire("unknownFileType", listed[i]);
					} else {
						if (fileIsText.value) {
							rv.push(listed[i]);
						}
					}
				}
				return rv;
			}
		}

		/**
		 *
		 * @param { string } line
		 */
		function hasTrailingWhitespace(line) {
			//	Although using trailing whitespace parser would work, this method testing a single character is equivalent and about
			//	10 times faster
			return /\s/.test(line.substring(line.length-1));
		}

		var trailingWhitespaceParser = /(.*?)\s+$/;

		/**
		 *
		 * @param { string } line
		 * @returns
		 */
		function withoutTrailingWhitespace(line) {
			var match = trailingWhitespaceParser.exec(line);
			return (match) ? match[1] : line;
		}

		/**
		 *
		 * @type { slime.tools.code.Exports["scanForTrailingWhitespace"] }
		 */
		function findTrailingWhitespaceIn(code) {
			var ending = (code.indexOf("\r\n") != -1) ? "\r\n" : "\n";
			var scan = code.split(ending).reduce(function(rv,line,index) {
				if (hasTrailingWhitespace(line)) {
					rv.instances.push({
						line: index+1,
						content: line
					});
					rv.without.push(withoutTrailingWhitespace(line));
				} else {
					rv.without.push(line);
				}
				return rv;
			}, {
				/** @type { { line: number, content: string }[] } */
				instances: [],
				/** @type { string[] } */
				without: []
			});
			return {
				without: scan.without.join(ending),
				instances: scan.instances
			}
		}

		/** @type { <T>(m: slime.$api.fp.Maybe<T>) => T } */
		function Maybe_assert(m) {
			if (m.present) return m.value;
			throw new Error("Asserted Maybe that was Nothing.");
		}

		var readFileString = $api.fp.pipe(
			$api.fp.world.mapping(
				$context.library.file.world.Location.file.read.string.world()
			),
			Maybe_assert
		)

		/**
		 *
		 * @param { slime.jrunscript.file.world.Location } file
		 * @param { string } string
		 */
		var writeFileString = function(file,string) {
			var write = $context.library.file.world.Location.file.write(file);
			$api.fp.world.now.action(write.string, { value: string });
		};

		//	TODO	obviously this is not ideal
		/** @type { (location: slime.jrunscript.file.world.Location) => string } */
		var getBasename = function(location) {
			return $context.library.file.Pathname(location.pathname).basename;
		}

		/**
		 *
		 * @type { slime.tools.code.internal.functions["handleFileTrailingWhitespace"] }
		 */
		function handleFileTrailingWhitespace(configuration) {
			return function(entry) {
				if (!configuration) configuration = {
					nowrite: false
				};
				return function(events) {
					var code = readFileString(entry.file);
					var scan = findTrailingWhitespaceIn(code);
					scan.instances.forEach(function(instance) {
						events.fire("foundAt", {
							file: entry,
							line: {
								number: instance.line,
								content: instance.content
							}
						});
					});
					if (scan.instances.length) {
						events.fire("foundIn", entry);
						if (!configuration.nowrite) {
							writeFileString(entry.file, scan.without);
						}
					} else {
						events.fire("notFoundIn", entry);
					}
				};
			}
		}

		/**
		 * @type { slime.tools.code.internal.functions["handleFilesTrailingWhitespace"] }
		 */
		var handleFilesTrailingWhitespace = function(p) {
			return function(files) {
				return function(events) {
					files.forEach(function(entry) {
						handleFileTrailingWhitespace(p)(entry)(events);
					})
				};
			}
		};

		/**
		 * @type { slime.tools.code.Exports["handleDirectoryTrailingWhitespace"] }
		 */
		var handleDirectoryTrailingWhitespace = function(p) {
			return function(events) {
				//	TODO	is there a simpler way to forward all those events below?
				var files = $api.fp.world.now.question(
					getDirectoryObjectSourceFiles,
					{
						base: p.base,
						isText: (p.isText) ? p.isText : function(file) {
							return filename.isText(getBasename(file.file));
						},
						exclude: p.exclude
					},
					{
						unknownFileType: function(e) {
							events.fire("unknownFileType", e.detail);
						}
					}
				);
				handleFilesTrailingWhitespace({ nowrite: p.nowrite })(files)(events);
			};
		};

		/**
		 * @type { slime.tools.code.Exports["handleGitTrailingWhitespace"] }
		 */
		var handleGitTrailingWhitespace = function(p) {
			return function(events) {
				var files = $api.fp.world.now.question(
					getGitSourceFiles,
					{
						repository: $context.library.file.world.Location.from.os(p.repository),
						submodules: true,
						isSource: updateIsText(p.isText)
					},
					{
						unknownFileType: function(e) {
							events.fire("unknownFileType", e.detail);
						}
					}
				);
				handleFilesTrailingWhitespace({ nowrite: p.nowrite })(files)(events);
			}
		}

		/** @type { slime.tools.code.Exports["checkSingleFinalNewline"] } */
		var checkSingleFinalNewline = function(string) {
			var lines = string.split("\n");
			var missing = false;
			var multiple = false;
			if (lines[lines.length-1] != "") {
				missing = true;
				lines.push("");
			}
			while(lines[lines.length-2] == "") {
				multiple = true;
				lines.splice(lines.length-2, 1);
			}
			return {
				missing: missing,
				multiple: multiple,
				fixed: lines.join("\n")
			}
		}

		/** @type { slime.tools.code.internal.functions["handleFileFinalNewlines"] } */
		function handleFileFinalNewlines(p) {
			return function(entry) {
				return function(events) {
					var code = readFileString(entry.file);
					var check = checkSingleFinalNewline(code);
					if (check.missing) events.fire("missing", entry);
					if (check.multiple) events.fire("multiple", entry);
					if (!p.nowrite && (check.missing || check.multiple)) {
						writeFileString(entry.file, check.fixed);
					}
				}
			}
		}

		/** @type { slime.tools.code.Exports["handleDirectoryFinalNewlines"] } */
		function handleFinalNewlines(p) {
			return function(events) {
				//	TODO	is there a simpler way to forward all those events below?
				$api.fp.world.now.question(
					getDirectoryObjectSourceFiles,
					{
						base: p.base,
						isText: (p.isText) ? p.isText : function(file) {
							return filename.isText(getBasename(file.file));
						},
						exclude: p.exclude
					},
					{
						unknownFileType: function(e) {
							events.fire("unknownFileType", e.detail);
						}
					}
				).forEach(function(entry) {
					var code = readFileString(entry.file);
					var check = checkSingleFinalNewline(code);
					if (check.missing) events.fire("missing", entry);
					if (check.multiple) events.fire("multiple", entry);
					if (!p.nowrite && (check.missing || check.multiple)) {
						writeFileString(entry.file, check.fixed);
					}
				});
			};
		}

		/** @type { slime.tools.code.Exports["handleGitFinalNewlines"] } */
		function handleGitFinalNewlines(p) {
			return function(events) {
				var files = $api.fp.world.now.question(
					getGitSourceFiles,
					{
						repository: $context.library.file.world.Location.from.os(p.repository),
						submodules: true,
						isSource: updateIsText(p.isText)
					},
					{
						unknownFileType: function(e) {
							events.fire("unknownFileType", e.detail);
						}
					}
				);
				files.forEach(function(entry) {
					handleFileFinalNewlines(p)(entry)(events);
				});
			}
		}

		/** @type { slime.tools.code.Exports["File"]["hasShebang"] } */
		function hasShebang() {
			return function(file) {
				return function(events) {
					var input = $api.fp.world.now.question(
						$context.library.file.world.Location.file.read.stream(),
						file.file
					);
					if (!input.present) return $api.fp.Maybe.from.nothing();
					var _input = input.value.java.adapt();
					var _1 = _input.read();
					var _2 = _input.read();
					_input.close();
					return $api.fp.Maybe.from.some(_1 == 35 && _2 == 33);
				}
			}
		}

		/** @type { slime.$api.fp.Predicate<slime.runtime.document.Element> } */
		var isJsapiTestingElement = $api.fp.Predicate.and(
			$context.library.document.Element.isName("script"),
			$api.fp.pipe(
				$context.library.document.Element.getAttribute("type"),
				function(value) {
					return value.present && /application\/x.jsapi\#/.test(value.value)
				}
			)
		)

		var Element = {
			isJsapiTestingElement: isJsapiTestingElement,
			/** @type { (p: slime.runtime.document.Document) => slime.runtime.document.Element[]  } */
			getJsapiTestingElements: $api.fp.pipe(
				$context.library.document.Parent.nodes,
				$api.fp.Stream.filter($context.library.document.Node.isElement),
				$api.fp.Stream.filter(isJsapiTestingElement),
				$api.fp.Stream.collect
			)
		};

		var document = {
			parse: function(markup) {
				var parsed = $context.library.document.Document.codec.string.decode(
					markup
				);

				(function checkParser() {
					var serialized = $context.library.document.Document.codec.string.encode(parsed);

					if (markup != serialized) {
						return $api.fp.Maybe.from.nothing();
					}
				})();

				return $api.fp.Maybe.from.some(parsed);
			}
		}

		var jsapi = {
			Location: {
				parse: $api.fp.pipe(
					$api.fp.Partial.impure.old.exception({
						try: $api.fp.world.mapping($context.library.file.Location.file.read.string.world()),
						nothing: function(e) { throw new Error("Could not read file: " + e.pathname + " in " + e.filesystem); }
					}),
					document.parse
				),
				is: function(location) {
					var parseJsapiHtml = $api.fp.Partial.impure.old.exception({
						try: jsapi.Location.parse,
						nothing: function(location) { return new Error("Could not parse: " + location.pathname); }
					});

					var basename = $context.library.file.Location.basename(location);
					if (basename == "api.html" || /\.api\.html$/.test(basename)) {
						return true;
					}
					if (/\.html$/.test(basename)) {
						var parsed = parseJsapiHtml(location);
						var elements = Element.getJsapiTestingElements(parsed);
						return Boolean(elements.length);
					}
				},
				group: function(location) {
					if (jsapi.Location.is(location)) return "jsapi";
					if (/\.fifty\.ts$/.test(location.pathname)) {
						return "fifty";
					}
					return "other";
				}
			}
		}

		/** @type { slime.$api.fp.Mapping<slime.tools.code.Project,slime.tools.code.JsapiAnalysis> } */
		var jsapiAnalysis = $api.fp.pipe(
			function omitJsapiImplementationFromJsapiUsage(p) {
				return {
					base: p.base,
					files: p.files.filter(function(file) {
						return file.pathname.toString().indexOf(["loader","api","old"].join($context.library.file.world.filesystems.os.separator.pathname)) == -1;
					})
				}
			},
			function(p) {
				//	TODO	simplify
				return {
					base: p.base,
					groups: $api.fp.Array.groupBy({
						/** @type { slime.$api.fp.Mapping<slime.jrunscript.file.Location,string> } */
						group: function(entry) {
							return jsapi.Location.group(entry);
						}
					})(p.files)
				}
			},
			function(p) {
				var getPath = $context.library.file.Location.directory.relativeTo(p.base);

				/**
				 *
				 * @param { slime.jrunscript.file.Location } entry
				 * @returns
				 */
				var fileSize = function(entry) {
					return $api.fp.world.now.ask($context.library.file.Location.file.size(entry));
				}

				/**
				 *
				 * @param { slime.jrunscript.file.Location[] } array
				 * @returns
				 */
				var totalSize = function(array) {
					return array.reduce(function(rv,entry) {
						return rv + fileSize(entry);
					},0);
				};

				/** @type { slime.$api.fp.Mapping<slime.runtime.document.Element,number> } */
				var getTestSize = function(element) {
					if (element.children.length > 1) throw new Error("Multiple children: " + JSON.stringify(element.children));
					var only = element.children[0];
					if ($context.library.document.Node.isString(only)) {
						return only.data.length;
					} else {
						throw new Error("Not string: " + JSON.stringify(only));
					}
				};

				return p.groups.map(
					/** @returns { slime.tools.code.JsapiMigrationData } } */
					function(group) {
						return {
							name: group.group,
							files: group.array.length,
							bytes: totalSize(group.array),
							list: function() {
								return group.array.map(function(file) {
									var tests = (function() {
										var parsed = jsapi.Location.parse(file);
										if (parsed.present) {
											var tests = Element.getJsapiTestingElements(parsed.value).reduce(function(rv,element) {
												return rv + getTestSize(element);
											}, 0);
											return $api.fp.Maybe.from.some(tests);
										} else {
											return $api.fp.Maybe.from.nothing();
										}
									})();
									return {
										path: getPath(file),
										bytes: fileSize(file),
										tests: tests
									}
								}).sort(function(a,b) {
									return b.bytes - a.bytes;
								});
							}
						}
					}
				)
			},
			function(p) {
				var byName = function(name) {
					return p.find(function(group) {
						return group.name == name;
					});
				};

				return {
					jsapi: byName("jsapi"),
					fifty: byName("fifty")
				}
			}
		);

		//	TODO	should compare filesystems, or does relativeTo do that?
		/** @param { slime.jrunscript.file.Location } base */
		var locationToFile = function(base) {
			/** @returns { slime.tools.code.File } */
			return function(location) {
				return {
					path: $context.library.file.Location.directory.relativeTo(base)(location),
					file: location
				}
			}
		};

		$export({
			Project: {
				from: {
					directory: function(p) {
						var question = $context.library.file.Location.directory.list.stream.world({
							descend: p.excludes.descend
						});
						var listing = $api.fp.world.now.question(question, p.root);
						var files = $api.fp.now.invoke(
							listing,
							$api.fp.Stream.filter($api.fp.world.mapping($context.library.file.Location.file.exists.world())),
							$api.fp.Stream.filter(function(location) {
								var include = p.excludes.isSource(location);
								if (include.present) return include.value;
								throw new TypeError("Could not determine whether source file: " + location.pathname);
							}),
							$api.fp.Stream.collect
						);
						return {
							base: p.root,
							files: files
						};
					},
					git: function(p) {
						//	TODO	descends property is not used, but API does not reflect that
						var excludes = (p.excludes) ? p.excludes : {
							descend: function(directory) {
								return true;
							},
							isSource: function(file) {
								return $api.fp.Maybe.from.some(true);
							}
						};
						var files = $api.fp.world.now.question(
							getGitSourceFiles,
							{
								repository: p.root,
								isSource: downgradeIsSource(excludes.isSource),
								submodules: p.submodules
							}
						).map(function(file) {
							return file.file;
						});
						return {
							base: p.root,
							files: files
						};
					}
				},
				files: function(project) {
					return project.files.map(locationToFile(project.base));
				},
				gitignoreLocal: $api.fp.world.Means.from.flat(
					function(p) {
						var readString = $api.fp.world.Sensor.old.mapping({
							sensor: $context.library.file.Location.file.read.string.world()
						});

						/** @param { { location: slime.jrunscript.file.Location, content: string } } p */
						var write = function(p) {
							var write = $api.fp.now.invoke(
								p.location,
								$context.library.file.Location.file.write,
								$api.fp.property("string")
							);

							$api.fp.world.now.action(
								write,
								{ value: p.content }
							);
						};

						var gitignore = $api.fp.now.invoke(p.order.base, $context.library.file.Location.directory.relativePath(".gitignore"));

						var snippet = [
							"# Local work directory for SLIME projects",
							"/local"
						];

						//	TODO	this implementation inefficiently reads the contents multiple times

						/** @type { slime.$api.fp.Partial<slime.jrunscript.file.Location,slime.$api.fp.impure.Process> } */
						var process = $api.fp.switch([
							$api.fp.Partial.match({
								if: $api.fp.pipe(
									readString,
									$api.fp.property("present"),
									function(b) { return !b; }
								),
								then: function(location) {
									return function() {
										p.events.fire("creating", { file: location });
										var output = snippet.join("\n") + "\n";
										write({ location: location, content: output });
									}
								}
							}),
							$api.fp.Partial.match({
								if: $api.fp.pipe(
									readString,
									$api.fp.Maybe.map(
										$api.fp.pipe(
											$api.fp.string.split("\n"),
											$api.fp.Array.some(function(item) {
												return item == "/local";
											})
										)
									),
									$api.fp.Maybe.else( $api.fp.impure.Input.value(false) )
								),
								then: function(location) {
									return function() {
										p.events.fire("found", { file: location, pattern: "/local" });
									}
								}
							}),
							function(location) {
								return $api.fp.Maybe.from.some(
									function() {
										p.events.fire("updating", { file: location });
										var input = readString(location);
										if (input.present) {
											var output = snippet.concat([
												""
											]).join("\n") + "\n" + input.value;

											write({ location: location, content: output });
										} else {
											throw new Error("Unreachable.");
										}
									}
								)
							}
						]);

						var effect = $api.fp.now.invoke(
							gitignore,
							$api.fp.Partial.impure.old.exception({
								try: process,
								nothing: function(t) { throw new Error("Unreachable: .gitignore classification.") }
							})
						);

						$api.fp.impure.now.process(effect);
					}
				)
			},
			jsapi: {
				Location: jsapi.Location,
				Element: {
					getTestingElements: Element.getJsapiTestingElements
				},
				analysis: jsapiAnalysis,
				report: function(p) {
					return function(project) {
						var data = jsapiAnalysis(project);

						[data.fifty, data.jsapi].forEach(function(group) {
							p.line(group.name + ": " + group.files + " files, " + group.bytes + " bytes");
							if (group.name == "jsapi") {
								group.list().forEach(function(item) {
									p.line(item.path + " " + item.bytes + " tests: " + ( (item.tests.present) ? item.tests.value : "?" ));
								})
							}
							p.line("");
						});

						p.line("Converted: " + ( data.fifty.bytes / (data.fifty.bytes + data.jsapi.bytes) * 100 ).toFixed(1) + "%");

						p.line("");
						p.line("JSAPI tests:");
						var files = 0;
						var bytes = 0;
						data.jsapi.list().filter(function(file) {
							if (file.tests.present && file.tests.value == 0) return false;
							return true;
						}).sort(function(a,b) {
							if (!a.tests.present && !b.tests.present) return 0;
							if (!a.tests.present && b.tests.present) return 1;
							if (a.tests.present && !b.tests.present) return -1;
							if (a.tests.present && b.tests.present) {
								return b.tests.value - a.tests.value;
							}
						}).forEach(function(item) {
							files += 1;
							bytes += (item.tests.present) ? item.tests.value : 0;
							p.line(item.path + " " + item.bytes + " tests: " + ( (item.tests.present) ? item.tests.value : "?" ));
						});
						p.line("");
						p.line("Files with tests: " + files);
						p.line("Tests: " + bytes);
					}
				}
			},
			File: (
				function() {
					var isJavascript = function(file) {
						return /\.js$/.test(file.path)
					};

					var read = $api.fp.Partial.impure.old.exception({
						/** @type { slime.$api.fp.Mapping<slime.jrunscript.file.Location,slime.$api.fp.Maybe<string>> } */
						try: $api.fp.world.Sensor.old.mapping({ sensor: $context.library.file.Location.file.read.string.world() }),
						nothing: function(location) { return new Error("Could not read: " + location.pathname) }
					});

					/** @type { slime.tools.code.Exports["File"]["isText"]["world"] } */
					var isText = function() {
						return function(file) {
							return function(events) {
								var basename = getBasename(file.file);
								var byExtension = filename.isText(basename);
								if (typeof(byExtension) == "boolean") return $api.fp.Maybe.from.some(byExtension);
								if (basename.indexOf(".") == -1) {
									var rv = hasShebang()(file)(events);
									if (rv.present) return rv;
								}
								return $api.fp.Maybe.from.nothing();
							}
						}
					};

					return {
						from: {
							location: locationToFile
						},
						hasShebang: hasShebang,
						isText: {
							world: isText,
							basic: $api.fp.world.Sensor.old.mapping({
								sensor: isText()
							})
						},
						isJavascript: isJavascript,
						isTypescript: function(file) {
							return (/\.ts$/.test(file.path));
						},
						isFiftyDefinition: function(file) {
							return (/\.fifty\.ts$/.test(file.path));
						},
						javascript: {
							hasTypeChecking: function(file) {
								if (isJavascript(file)) {
									var code = read(file.file);
									return $api.fp.Maybe.from.some(code.indexOf("ts-check") != -1);
								}
								return $api.fp.Maybe.from.nothing();
							}
						}
					};
				}
			)(),
			filename: filename,
			directory: directory,
			defaults: defaults,
			scanForTrailingWhitespace: findTrailingWhitespaceIn,
			handleDirectoryTrailingWhitespace: handleDirectoryTrailingWhitespace,
			handleGitTrailingWhitespace: handleGitTrailingWhitespace,
			checkSingleFinalNewline: checkSingleFinalNewline,
			handleDirectoryFinalNewlines: handleFinalNewlines,
			handleGitFinalNewlines: handleGitFinalNewlines
		})
	}
//@ts-ignore
)($api,$context,$export);
