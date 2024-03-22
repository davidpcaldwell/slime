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
		var downloads = $context.downloads ? $context.downloads : $context.library.shell.TMPDIR.createTemporary({ directory: true })

		var client = ($context.client) ? $context.client : new $context.library.http.Client();

		var scripts = {
			apache: $loader.script("apache.js")
		}

		var TGZ = /(.*)\.tgz$/;
		var TARGZ = /(.*)\.tar\.gz$/;
		var TARXZ = /(.*)\.tar\.xz$/;
		var ZIP = /(.*)\.zip$/;

		var algorithms = {
			gzip: new function() {
				var tar = $context.library.shell.PATH.getCommand("tar");

				this.getDestinationPath = function(basename) {
					if (TGZ.test(basename)) return TGZ.exec(basename)[1];
					if (TARGZ.test(basename)) return TARGZ.exec(basename)[1];
					if (TARXZ.test(basename)) return TARXZ.exec(basename)[1];
					//	TODO	list directory and take only option if there is only one and it is a directory?
					throw new Error("Cannot determine destination path for " + basename);
				};

				if (tar) {
					this.extract = function(file,to) {
						$context.library.shell.run({
							command: $context.library.shell.PATH.getCommand("tar"),
							arguments: ["xf", file.pathname],
							directory: to
						});
					}
				}
			},
			zip: new function() {
				this.getDestinationPath = function(basename) {
					if (ZIP.test(basename)) return ZIP.exec(basename)[1];
					//	TODO	list directory and take only option if there is only one and it is a directory?
					throw new Error("Cannot determine destination path for " + basename);
				};

				this.extract = function(file,to) {
					if ($context.library.shell.PATH.getCommand("unzip")) {
						$context.library.shell.run({
							command: "unzip",
							//	TODO	added -o option to deal with strange Selenium 4.0.0 ZIP file; examine further
							arguments: ["-o", file],
							directory: to
						});
					} else {
						$context.library.file.unzip({
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
		 * @returns { slime.$api.fp.Maybe<slime.jrunscript.tools.install.distribution.Format> }
		 */
		var getFormatFromMimeType = function(type) {
			if (type.media == "application" && type.subtype == "zip") return $api.fp.Maybe.from.some(newFormats.zip);
			if (type.media == "application" && type.subtype == "gzip") return $api.fp.Maybe.from.some(newFormats.targz);
			return $api.fp.Maybe.from.nothing();
		}

		/** @type { (url: string) => slime.$api.fp.Maybe<slime.jrunscript.tools.install.distribution.Format> } */
		var getFormatFromUrl = function(url) {
			if (ZIP.test(url)) return $api.fp.Maybe.from.some(newFormats.zip);
			if (TARGZ.test(url) || TGZ.test(url) || TARXZ.test(url)) return $api.fp.Maybe.from.some(newFormats.targz);
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
		 * @param { slime.jrunscript.tools.install.old.WorldSource } p
		 * @param { slime.$api.event.Emitter<{ console: string }> } events
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
			return $context.library.web.Url.codec.string.encode(p);
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
		 * @param { slime.$api.event.Emitter<{ console: string }> } events
		 * @returns { slime.jrunscript.file.Directory }
		 */
		var installLocalArchive = function(p,events) {
			var file = $context.library.file.Pathname(String(p.file)).file;
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
			var untardir = $context.library.shell.TMPDIR.createTemporary({ directory: true });
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
			//	TODO	however, if p.to exists and is a directory, mv has the wrong semantics here
			if ($context.library.shell.PATH.getCommand("mv")) {
				p.to.parent.createDirectory({
					exists: function(dir) {
						return false;
					}
				});
				$context.library.shell.run({
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
		 * @param { slime.$api.event.Emitter<{ console: string }> } events
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
		var newOldInstall = function(p) {
			return $api.fp.world.old.tell(function(events) {
				if (typeof(p.source.file) != "string" && typeof(p.source.file) != "undefined") {
					throw new TypeError("source.file must be string.");
				}
				return install({
					url: p.source.url,
					name: p.source.name,
					file: (p.source.file) ? $context.library.file.Pathname(p.source.file).file : void(0),
					format: (p.archive && p.archive.format),
					getDestinationPath: (p.archive && p.archive.folder),
					to: $context.library.file.Pathname(p.destination.location),
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
				 * @param { slime.$api.event.Emitter<slime.jrunscript.tools.install.events.Console> } events
				 */
				function(p,events) {
					var source = toModernSource(p);
					get(source,events);
					return $context.library.file.Pathname(source.file).file;
				}
			)
		};

		/**
		 *
		 * @param { slime.$api.event.Emitter<slime.jrunscript.tools.install.download.Events> } events
		 * @returns
		 */
		var createFetcher = function(events) {
			return $api.fp.world.mapping(
				$context.library.http.World.withFollowRedirects($context.library.http.world.java.urlconnection),
				{
					request: function(e) {
						events.fire("request", e.detail);
					}
				}
			);
		}

		$export({
			test: {
				getDefaultName: getDefaultName
			},
			Distribution: {
				from: (
					function() {
						var url = function(url) {
							var format = getFormatFromUrl(url);
							return {
								url: url,
								name: getDefaultName(url),
								format: (format.present) ? format.value : void(0)
							}
						};

						return {
							url: url,
							file: function(p) {
								var rv = url(p.url);
								return $api.Object.compose(
									rv,
									(p.prefix) ? { prefix: p.prefix(rv) } : {}
								);
							}
						}
					}
				)(),
				Format: newFormats,
				install: {
					world: function(p) {
						/**
						 *
						 * @param { string } filename
						 * @return { slime.$api.fp.Maybe<slime.mime.Type> }
						 */
						var getFilenameMimeType = function(filename) {
							var decode = $api.mime.Type.codec.declaration.decode;
							if (/\.zip$/.test(filename)) return $api.fp.Maybe.from.some(decode("application/zip"));
							if (/\.tgz$/.test(filename)) return $api.fp.Maybe.from.some(decode("application/gzip"));
							if (/\.tar.gz$/.test(filename)) return $api.fp.Maybe.from.some(decode("application/gzip"));
							return $api.fp.Maybe.from.nothing();
						}

						/** @param { slime.jrunscript.file.File } file */
						var getFileMimeType = function(file) {
							return getFilenameMimeType(file.pathname.basename);
						};

						/** @param { slime.jrunscript.http.client.spi.Response } response */
						var getResponseMimeType = function(response) {
							return $api.fp.result(
								$context.library.http.Header.value("Content-Type")(response.headers),
								$api.fp.Maybe.map($api.mime.Type.codec.declaration.decode),
								function(maybe) {
									if (maybe.present && maybe.value.media == "application" && maybe.value.subtype == "octet-stream") return $api.fp.Maybe.from.nothing();
									return maybe;
								}
							);
						};

						var getUrlMimeType = function(url) {
							var name = getDefaultName(url);
							return getFilenameMimeType(name);
						}

						/**
						 *
						 * @param { slime.jrunscript.tools.install.Distribution } download
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
								$context.library.http.Argument.from.request({
									url: download.url
								})
							);

							var getMimeType = $api.fp.switch([
								function() { return getResponseMimeType(response); },
								function() { return getUrlMimeType(download.url) }
							]);

							var format = $api.fp.switch(
								[
									function() { return $api.fp.Maybe.from.value(download.format); },
									function() {
										var mime = getMimeType();
										if (mime.present) {
											return getFormatFromMimeType(mime.value);
										}
										return $api.fp.Maybe.from.nothing();
									}
								]
							)();

							// var type = $context.api.http.Header.value("Content-Type")(response.headers);
							// throw new Error("type = " + ((type.present) ? type.value : "(absent)"));
							if (!format.present) throw new Error("Could not determine format of archive at: " + download.url + " (type: " + getResponseMimeType(response) + ")");
							if (!local) {
								local = $context.library.shell.TMPDIR.createTemporary({ directory: true }).getRelativePath("archive" + format.value.extension);
							}
							var location = local.os.adapt();
							var w = $context.library.file.world.Location.file.write(location);
							$api.fp.world.now.action(w.stream, { input: response.stream });
							return { file: local.file, type: getMimeType() };
						}

						return function(events) {
							var Location = $context.library.file.Location;

							var ifExists = $api.fp.now.map(
								p.clean,
								$api.fp.Maybe.from.value,
								$api.fp.Maybe.map(
									$api.fp.Boolean.map({
										true: Location.remove.simple,
										false: $api.fp.impure.Output.nothing()
									})
								),
								$api.fp.Maybe.else(
									/**
									 *
									 * @returns { slime.$api.fp.impure.Output<slime.jrunscript.file.Location> }
									 */
									function() {
										return function(location) {
											throw new Error("Already exists: " + location.pathname);
										}
									}
								)
							);

							var to = $api.fp.now.map(p.to, $context.library.file.Location.from.os);

							var exists = $api.fp.now.map(
								to,
								$api.fp.Predicate.or(
									$context.library.file.Location.file.exists.simple,
									$context.library.file.Location.directory.exists.simple
								)
							);

							if (exists) {
								events.fire("exists", to);
								ifExists(to);
							}

							var fetch = createFetcher(events);
							var archive = getArchive(p.download,fetch);
							events.fire("archive", archive.file);

							var format = (
								function() {
									if (p.download.format) return p.download.format;
									if (archive.type.present) {
										var maybe = getFormatFromMimeType(archive.type.value);
										if (maybe.present) return maybe.value;
									}
								}
							)();

							if (!format) throw new Error("Could not determine format of archive: " + archive.file);
							if (!format.extract) throw new Error("No algorithm to extract " + format.extension);

							/**
							 *
							 * @param { ReturnType<getArchive> } archive
							 * @param { string } ospath
							 */
							var extractTo = function(archive,ospath) {
								var p_to = $context.library.file.Pathname(ospath);
								if (!p_to.directory) p_to.createDirectory({ recursive: true });
								var to = p_to.directory;
								//	TODO	no world-oriented equivalent
								format.extract(archive.file, to);
							}

							if (p.download.prefix) {
								var tmp =  $context.library.shell.TMPDIR.createTemporary({ directory: true }).pathname;
								tmp.directory.remove();
								extractTo(archive, tmp.toString());
								var unzippedTo = tmp.directory.getSubdirectory(p.download.prefix);
								unzippedTo.move($context.library.file.Pathname(p.to), {
									//	TODO	what's the right value for overwrite?
									overwrite: false,
									recursive: true
								});

							} else {
								extractTo(archive, p.to);
							}
						}
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
						return newOldInstall(p);
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
			//	TODO	below seems to be used in tomcat.js and also in hg installation
			$api: {
				Events: {
					Function: $api.deprecate($api.events.Function)
				}
			},
			download: function(p) {
				return function(e) {
					var fetch = createFetcher(e);
					/** @type { slime.jrunscript.http.client.Request } */
					var request = {
						url: p.from
					};
					var argument = $context.library.http.Argument.from.request(request);
					var response = fetch(argument);
					if (response.status.code != 200) throw new Error("HTTP: " + response.status.code + " for " + p.from);
					var w = $context.library.file.Location.file.write(p.to);
					$api.fp.world.now.action(w.stream, { input: response.stream });
				}
			}
		})

	}
//@ts-ignore
)($api,$context,$loader,$export)
