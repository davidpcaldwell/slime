//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.tools.install.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jrunscript.tools.install.Exports> } $export
	 */
	function($api,$context,$loader,$export) {
		var downloads = $context.downloads ? $context.downloads : $context.api.shell.TMPDIR.createTemporary({ directory: true })

		var client = ($context.client) ? $context.client : new $context.api.http.Client();

		var scripts = {
			apache: $loader.script("apache.js")
		}

		var algorithms = {
			gzip: new function() {
				var tar = $context.api.shell.PATH.getCommand("tar");

				this.getDestinationPath = function(basename) {
					var TGZ = /(.*)\.tgz$/;
					var TARGZ = /(.*)\.tar\.gz$/;
					var TARXZ = /(.*)\.tar\.xz$/;
					if (TGZ.test(basename)) return TGZ.exec(basename)[1];
					if (TARGZ.test(basename)) return TARGZ.exec(basename)[1];
					if (TARXZ.test(basename)) return TARXZ.exec(basename)[1];
					//	TODO	list directory and take only option if there is only one and it is a directory?
					throw new Error("Cannot determine destination path for " + basename);
				};

				if (tar) {
					this.extract = function(file,to) {
						$context.api.shell.run({
							command: $context.api.shell.PATH.getCommand("tar"),
							arguments: ["xf", file.pathname],
							directory: to
						});
					}
				}
			},
			zip: new function() {
				this.getDestinationPath = function(basename) {
					var ZIP = /(.*)\.zip$/;
					if (ZIP.test(basename)) return ZIP.exec(basename)[1];
					//	TODO	list directory and take only option if there is only one and it is a directory?
					throw new Error("Cannot determine destination path for " + basename);
				};

				this.extract = function(file,to) {
					if ($context.api.shell.PATH.getCommand("unzip")) {
						$context.api.shell.run({
							command: "unzip",
							//	TODO	added -o option to deal with strange Selenium 4.0.0 ZIP file; examine further
							arguments: ["-o", file],
							directory: to
						});
					} else {
						$context.api.file.unzip({
							zip: file,
							to: to
						});
					}
				}
			}
		};

		var formats = (
			function() {
				var format = {
					zip: algorithms.zip
				};

				if (algorithms.gzip.extract) {
					format.gzip = algorithms.gzip;
				}
				return format;
			}
		)();

		var newFormats = {
			zip: {
				extension: ".zip",
				extract: formats.zip.extract
			},
			targz: {
				extension: ".tgz",
				extract: algorithms.gzip.extract
			}
		};

		/**
		 *
		 * @param { slime.mime.Type } type
		 * @returns { slime.$api.fp.Maybe<slime.jrunscript.tools.install.download.Format> }
		 */
		var getFormat = function(type) {
			if (type.media == "application" && type.subtype == "zip") return $api.fp.Maybe.from.some(newFormats.zip);
			if (type.media == "application" && type.subtype == "gzip") return $api.fp.Maybe.from.some(newFormats.targz);
			return $api.fp.Maybe.from.nothing();
		}

		/**
		 *
		 * @param { string } url
		 */
		function getDefaultName(url) {
			//	TODO	does js/web have something like this? Should it?
			return url.split("/").slice(-1)[0];
		}

		/**
		 *
		 * @param { string } url
		 */
		function getDefaultLocation(url) {
			var filename = getDefaultName(url);
			if ($context.downloads) return $context.downloads.getRelativePath(filename).os.adapt();
			return $context.api.shell.TMPDIR.getRelativePath(filename).os.adapt();
		}

		/**
		 * @param { slime.jrunscript.tools.install.old.WorldSource } p
		 * @param { slime.$api.Events<{ console: string }> } events
		 */
		var get = function(p,events) {
			//	TODO	If typeof(p.file) is undefined, probably should try to use user downloads directory with p.name if present as default value
			if (!p.file) {
				if (p.url) {
					//	Apache supplies name so that url property, which is getter that hits Apache mirror list, is not invoked
					if (!p.name) p.name = getDefaultName(p.url);
					var pathname = downloads.getRelativePath(p.name);
					if (!pathname.file) {
						//	TODO	we could check to make sure this URL is http
						//	Only access url property once because in Apache case it is actually a getter that can return different values
						events.fire("console", "Downloading from " + p.url + " to: " + downloads);
						var response = client.request({
							url: p.url
						});
						pathname.write(response.body.stream, { append: false });
						events.fire("console", "Wrote to: " + downloads);
					} else {
						events.fire("console", "Found " + pathname.file + "; using cached version.");
					}
					p.file = pathname.file.toString();
				}
			}
			return p;
		};

		/**
		 *
		 * @param { slime.jrunscript.http.client.request.url } p
		 */
		var urlToString = function(p) {
			if (typeof(p) == "string") return p;
			return $context.api.web.Url.codec.string.encode(p);
		}

		/**
		 *
		 * @param { slime.jrunscript.tools.install.old.Source } oldSource
		 * @returns { slime.jrunscript.tools.install.old.WorldSource }
		 */
		var toModernSource = function(oldSource) {
			return {
				url: (oldSource.url) ? urlToString(oldSource.url) : void(0),
				name: oldSource.name,
				file: (oldSource.file) ? oldSource.file.toString() : void(0)
			}
		}

		/**
		 * @param { { name?: string, getDestinationPath?: (file: slime.jrunscript.file.File) => string, url?: any, file?: slime.jrunscript.file.File, format?: slime.jrunscript.tools.install.old.Format, to: slime.jrunscript.file.Pathname, replace?: boolean } } p
		 * @param { slime.$api.Events<{ console: string }> } events
		 * @returns { slime.jrunscript.file.Directory }
		 */
		var installLocalArchive = function(p,events) {
			var file = $context.api.file.Pathname(String(p.file)).file;
			if (!p.format) {
				var basename = (function() {
					if (p.name) return p.name;
					return (p.url) ? p.url.toString().split("/").slice(-1)[0] : p.file.pathname.basename;
				})();
				if (/\.tar\.xz$/.test(basename) && formats.gzip) p.format = formats.gzip;
				if (/\.tar\.gz$/.test(basename) && formats.gzip) p.format = formats.gzip;
				if (/\.tgz$/.test(basename) && formats.gzip) p.format = formats.gzip;
				if (/\.zip$/.test(basename)) p.format = formats.zip;
				if (/\.jar$/.test(basename)) p.format = formats.zip;
				if (!p.format) throw new TypeError("Required: 'format' property; basename = " + basename + "name=" + p.name + " url=" + p.url + " file=" + p.file);
			}
			var algorithm = p.format;
			var untardir = $context.api.shell.TMPDIR.createTemporary({ directory: true });
			events.fire("console", "Extracting " + file + " to " + untardir);
			algorithm.extract(file,untardir);
			var unzippedDestination = (function() {
				if (p.getDestinationPath) {
					return p.getDestinationPath(file);
				}
				var path = algorithm.getDestinationPath(file.pathname.basename);
				if (path) return path;
				//	TODO	list directory and take only option if there is only one and it is a directory?
				throw new Error("Cannot determine destination path for " + file);
			})();
			events.fire("console", "Assuming destination directory created was " + unzippedDestination);
			var unzippedTo = untardir.getSubdirectory(unzippedDestination);
			if (!unzippedTo) throw new TypeError("Expected directory " + unzippedDestination + " not found in " + untardir);
			events.fire("console", "Directory is: " + unzippedTo);
			//	TODO	right now, we will use the mv command preferentially because it works in some situations the Java
			//			java.io.File renameTo implementation does not (notable on our Docker setup, moving from a temporary
			//			directory to the installation directory, as we are doing here).
			if ($context.api.shell.PATH.getCommand("mv")) {
				p.to.parent.createDirectory({
					exists: function(dir) {
						return false;
					}
				});
				$context.api.shell.run({
					command: "mv",
					arguments: [unzippedTo.pathname.toString(), p.to.toString()]
				});
			} else {
				unzippedTo.move(p.to, {
					overwrite: p.replace,
					recursive: true
				});
			}
			return p.to.directory;
		};

		/**
		 * @param { slime.jrunscript.tools.install.old.Installation } p
		 * @param { slime.$api.Events<{ console: string }> } events
		 * @returns { slime.jrunscript.file.Directory }
		 */
		var install = function(p,events) {
			get(
				Object.assign(
					p,
					(
						(p.url) ? {
							url: (p.url) ? urlToString(p.url) : void(0),
							file: (p.file) ? p.file.toString() : void(0)
						} : {}
					)
				),
				events
			);
			return installLocalArchive(p,events);
		};

		var oldInstall = $api.events.Function(function(p,events) {
			return install(p,events);
		});

		/** @type { (p: slime.jrunscript.tools.install.old.WorldInstallation) => slime.$api.fp.world.old.Tell<slime.jrunscript.tools.install.events.Console> } */
		var newInstall = function(p) {
			return $api.fp.world.old.tell(function(events) {
				if (typeof(p.source.file) != "string" && typeof(p.source.file) != "undefined") {
					throw new TypeError("source.file must be string.");
				}
				return install({
					url: p.source.url,
					name: p.source.name,
					file: (p.source.file) ? $context.api.file.Pathname(p.source.file).file : void(0),
					format: (p.archive && p.archive.format),
					getDestinationPath: (p.archive && p.archive.folder),
					to: $context.api.file.Pathname(p.destination.location),
					replace: p.destination.replace
				}, events);
			});
		};

		var $exports = {
			/** @type { slime.jrunscript.tools.install.Exports["get"] } */
			get: $api.events.Function(
				/**
				 *
				 * @param { slime.jrunscript.tools.install.old.Source } p
				 * @param { slime.$api.Events<slime.jrunscript.tools.install.events.Console> } events
				 */
				function(p,events) {
					var source = toModernSource(p);
					get(source,events);
					return $context.api.file.Pathname(source.file).file;
				}
			)
		};

		$export({
			test: {
				getDefaultName: getDefaultName
			},
			Download: {
				from: {
					url: function(url) {
						return {
							url: url,
							name: getDefaultName(url)
						}
					}
				},
				Format: newFormats,
				install: function(p) {
					/** @param { slime.jrunscript.file.File } file */
					var getFileMimeType = function(file) {
						var basename = file.pathname.basename;
						var decode = $api.mime.Type.codec.declaration.decode;
						if (/\.zip$/.test(basename)) return $api.fp.Maybe.from.some(decode("application/zip"));
						if (/\.tgz$/.test(basename)) return $api.fp.Maybe.from.some(decode("application/gzip"));
						if (/\.tar.gz$/.test(basename)) return $api.fp.Maybe.from.some(decode("application/gzip"));
						return $api.fp.Maybe.from.nothing();
					};

					/** @param { slime.jrunscript.http.client.spi.Response } response */
					var getResponseMimeType = function(response) {
						return $api.fp.result(
							$context.api.http.Header.value("Content-Type")(response.headers),
							$api.fp.Maybe.map($api.mime.Type.codec.declaration.decode)
						);
					};

					/**
					 *
					 * @param { slime.jrunscript.tools.install.download.Format } specifiedFormat
					 * @param { slime.$api.fp.Maybe<slime.mime.Type> } mimeType
					 * @returns
					 */
					var getArchiveFormat = function(specifiedFormat, mimeType) {
						if (specifiedFormat) return specifiedFormat;
						if (mimeType.present) {
							var maybe = getFormat(mimeType.value);
							if (maybe.present) return maybe.value;
						}
					}

					/**
					 *
					 * @param { slime.jrunscript.tools.install.Download } download
					 * @param { (argument: slime.jrunscript.http.client.spi.Argument) => slime.jrunscript.http.client.spi.Response } fetch
					 * @returns { { file: slime.jrunscript.file.File, type: slime.$api.fp.Maybe<slime.mime.Type> } }
					 */
					var getArchive = function(download,fetch) {
						/** @type { slime.jrunscript.file.Pathname } */
						var local;
						if (download.name && $context.downloads) {
							local = $context.downloads.getRelativePath(download.name);
						}
						if (local && local.file) {
							return { file: local.file, type: getFileMimeType(local.file) };
						}
						var response = fetch(
							$context.api.http.Argument.request({
								url: download.url
							})
						);
						var format = getArchiveFormat(download.format, getResponseMimeType(response));
						// var type = $context.api.http.Header.value("Content-Type")(response.headers);
						// throw new Error("type = " + ((type.present) ? type.value : "(absent)"));
						if (!format) throw new Error("Could not determine format of archive at: " + download.url + " (type: " + getResponseMimeType(response) + ")");
						if (!local) {
							local = $context.api.shell.TMPDIR.createTemporary({ directory: true }).getRelativePath("archive" + format.extension);
						}
						var write = $context.api.file.world.Location.file.write.stream({ input: response.stream });
						$api.fp.world.now.action(write, local.os.adapt());
						return { file: local.file, type: getResponseMimeType(response) };
					}

					/**
					 *
					 * @param { slime.$api.Events<slime.jrunscript.tools.install.download.Events> } events
					 * @returns
					 */
					var createFetcher = function(events) {
						return $api.fp.world.mapping(
							$context.api.http.World.withFollowRedirects($context.api.http.world.java.urlconnection),
							{
								request: function(e) {
									events.fire("request", e.detail);
								}
							}
						);
					}

					return function(events) {
						var fetch = createFetcher(events);
						var archive = getArchive(p.download,fetch);
						events.fire("archive", archive.file);

						var format = (
							function() {
								if (p.download.format) return p.download.format;
								if (archive.type.present) {
									var maybe = getFormat(archive.type.value);
									if (maybe.present) return maybe.value;
								}
							}
						)();

						if (!format) throw new Error("Could not determine format of archive: " + archive.file);
						if (!format.extract) throw new Error("No algorithm to extract " + format.extension);

						var p_to = $context.api.file.Pathname(p.to);
						//	TODO	what if directory exists? Right now will bomb, which may be OK
						var to = p_to.createDirectory({ recursive: true });
						//	TODO	no world-oriented equivalent
						format.extract(archive.file, to);
					}
				}
			},
			get: $exports.get,
			//	TODO	find is completely untested
			find: function(p) {
				return $api.fp.world.old.ask(function(events) {
					get(p,events);
					return p.file;
				});
			},
			//	Just cannot get the overloading right below with TypeScript 4.0.5; it only detects the old version of the overload
			//@ts-ignore
			install: (
				/** @type { slime.jrunscript.tools.install.Exports["install"] } */
				function(p,events) {
					/** @type { (p: any) => p is slime.jrunscript.tools.install.old.Installation } */
					var isOld = function(p) { return Boolean(p["url"]) || Boolean(p["name"]) || Boolean(p["file"]); };
					if (isOld(p)) {
						return oldInstall(p,events);
					} else {
						return newInstall(p);
					}
				}
			),
			format: formats,
			apache: scripts.apache({
				client: client,
				get: $exports.get,
				downloads: downloads
			}),
			gzip: (algorithms.gzip.extract) ? $api.deprecate(function(p,on) {
				p.format = algorithms.gzip;
				oldInstall(p,on);
			}) : void(0),
			zip: $api.deprecate(function(p,on) {
				p.format = algorithms.zip;
				oldInstall(p,on);
			}),
			//	TODO	below seems to be used in tomcat.js
			$api: {
				Events: {
					Function: $api.deprecate(function(f,defaultOn) {
						var Listeners = function(p) {
							var source = {};
							var events = $api.Events({ source: source });

							this.add = function() {
								for (var x in p.on) {
									source.listeners.add(x,p.on[x]);
								}
							};

							this.remove = function() {
								for (var x in p.on) {
									source.listeners.remove(x,p.on[x]);
								}
							};

							this.events = events;
						};

						return function(p,on) {
							var listeners = new Listeners({
								on: $api.fp.evaluator(
									function() { return on; },
									function() { return defaultOn; },
									function() { return {}; }
								)()
							});
							listeners.add();
							try {
								return f(p,listeners.events);
							} finally {
								listeners.remove();
							}
						}
					})
				}
			}
		})

	}
//@ts-ignore
)($api,$context,$loader,$export)
