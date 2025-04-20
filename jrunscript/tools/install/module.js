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

		var client = $context.client ? $context.client : new $context.library.http.Client();

		var scripts = {
			apache: $loader.script("apache.js"),
			/** @type { slime.jrunscript.tools.install.downloads.Script } */
			downloads: $loader.script("downloads.js")
		};

		var components = {
			downloads: scripts.downloads({
				library: {
					file: $context.library.file,
					http: $context.library.http
				},
				getFilenameMimeType: getFilenameMimeType
			})
		};

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
		};

		var TGZ = /(.*)\.tgz$/;
		var TARGZ = /(.*)\.tar\.gz$/;
		var TARXZ = /(.*)\.tar\.xz$/;
		var ZIP = /(.*)\.zip$/;

		/** @type { { [format: string]: (basename: string) => string } } */
		var getPrefix = {
			gzip: function(basename) {
				if (TGZ.test(basename)) return TGZ.exec(basename)[1];
				if (TARGZ.test(basename)) return TARGZ.exec(basename)[1];
				if (TARXZ.test(basename)) return TARXZ.exec(basename)[1];
				//	TODO	list directory and take only option if there is only one and it is a directory?
				throw new Error("Cannot determine destination path for " + basename);
			},
			zip: function(basename) {
				if (ZIP.test(basename)) return ZIP.exec(basename)[1];
				//	TODO	list directory and take only option if there is only one and it is a directory?
				throw new Error("Cannot determine destination path for " + basename);
			}
		};

		var tar = $context.library.shell.PATH.getCommand("tar");

		var extract = {
			gzip: (tar)
				? function(file,to) {
					$context.library.shell.run({
						command: tar,
						arguments: ["xf", file.pathname],
						directory: to
					});
				}
				: void(0)
			,
			zip: function(file,to) {
				if ($context.library.shell.PATH.getCommand("unzip")) {
					var exit = $api.fp.world.Sensor.now({
						sensor: $context.library.shell.subprocess.question,
						subject: {
							command: "unzip",
							arguments: ["-o", file.pathname.toString()],
							directory: to.pathname.toString(),
							stdio: {
								output: "string",
								error: "string"
							}
						}
					});
					//	TODO	currently, except for this case, output is just swallowed
					if (exit.status != 0) {
						throw new Error("Non-zero exit status for unzip: " + exit.status + "\n" + exit.stdio.error);
					}
				} else {
					$context.library.file.unzip({
						zip: file,
						to: to
					});
				}
			}
		}

		/** @type { slime.jrunscript.tools.install.exports.Distribution["Format"] } */
		var formats = {
			zip: {
				extension: ".zip",
				extract: extract.zip
			},
			targz: {
				extension: ".tgz",
				extract: extract.gzip
			}
		};

		/**
		 *
		 * @param { slime.mime.Type } type
		 * @returns { slime.$api.fp.Maybe<slime.jrunscript.tools.install.distribution.Format> }
		 */
		var getFormatFromMimeType = function(type) {
			if (type.media == "application" && type.subtype == "zip") return $api.fp.Maybe.from.some(formats.zip);
			if (type.media == "application" && type.subtype == "gzip") return $api.fp.Maybe.from.some(formats.targz);
			return $api.fp.Maybe.from.nothing();
		}

		/** @type { (url: string) => slime.$api.fp.Maybe<slime.jrunscript.tools.install.distribution.Format> } */
		var getFormatFromUrl = function(url) {
			if (ZIP.test(url)) return $api.fp.Maybe.from.some(formats.zip);
			if (TARGZ.test(url) || TGZ.test(url) || TARXZ.test(url)) return $api.fp.Maybe.from.some(formats.targz);
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

		var deprecated = (
			function() {
				/** @type { slime.jrunscript.tools.install.deprecated.Script } */
				var script = $loader.script("deprecated.js");
				/** @type { slime.jrunscript.tools.install.deprecated.Context } */
				var context = {
					library: {
						web: $context.library.web,
						file: $context.library.file,
						shell: $context.library.shell
					},
					extract: extract,
					getPrefix: getPrefix,
					downloads: downloads,
					client: client,
					getDefaultName: getDefaultName
				}
				return script(context);
			}
		)();

		var DEFAULT_CLIENT = $context.library.http.World.withFollowRedirects($context.library.http.world.java.urlconnection);

		var fetcher = components.downloads.finder;

		/**
		 *
		 * @param { slime.$api.event.Emitter<slime.jrunscript.tools.install.download.Events> } events
		 */
		var createFetcher = function(events) {
			return fetcher(DEFAULT_CLIENT, events);
		};

		var find = components.downloads.find;

		var Distribution = {
			methods: {
				/**
				 * @type { slime.jrunscript.tools.install.distribution.Methods["install"] }
				 */
				install: function(client) {
					return function(downloads) {
						return function(order) {
							return function(events) {
								/**
								 *
								 * @param { slime.jrunscript.tools.install.Distribution } distribution
								 * @returns { { file: slime.jrunscript.file.File, type: slime.$api.fp.Maybe<slime.mime.Type> } }
								 */
								var getArchive = function(distribution) {
									var d = $api.fp.world.Sensor.now({
										sensor: find({ client: client, cache: downloads }),
										subject: distribution,
										handlers: {
											request: function(e) {
												events.fire("request", e.detail);
											}
										}
									});

									var format = $api.fp.switch(
										[
											function() { return $api.fp.Maybe.from.value(distribution.format); },
											function() {
												var mime = d.type;
												if (mime.present) {
													return getFormatFromMimeType(mime.value);
												}
												return $api.fp.Maybe.from.nothing();
											}
										]
									)();

									if (!format.present) throw new Error(
										"Could not determine format of archive at: " + distribution.url
										+ " (type: " + d.type + ")"
									);
									var pathname = $context.library.file.os.temporary.location();
									$api.fp.world.Action.now({
										action: $context.library.file.Location.file.write(
											pathname
										).stream({
											input: d.read()
										})
									});
									debugger;

									return {
										file: $context.library.file.Pathname(pathname.pathname).file,
										type: d.type
									};
								}

								var Location = $context.library.file.Location;

								var ifExists = $api.fp.now.map(
									order.clean,
									$api.fp.Maybe.from.value,
									$api.fp.Maybe.map(
										$api.fp.Boolean.map({
											true: $api.fp.impure.Output.compose([
												function(location) {
													events.fire("removing", location);
												},
												Location.remove.simple
											]),
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

								var to = $api.fp.now.map(order.to, $context.library.file.Location.from.os);

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

								var archive = getArchive(order.download);

								var format = (
									function() {
										if (order.download.format) return order.download.format;
										if (archive.type.present) {
											var maybe = getFormatFromMimeType(archive.type.value);
											if (maybe.present) return maybe.value;
										}
									}
								)();

								if (!format) throw new Error("Could not determine format of archive: type=" + archive.type);
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

								if (order.download.prefix) {
									var tmp =  $context.library.shell.TMPDIR.createTemporary({ directory: true }).pathname;
									tmp.directory.remove();
									extractTo(archive, tmp.toString());
									var unzippedTo = tmp.directory.getSubdirectory(order.download.prefix);
									unzippedTo.move($context.library.file.Pathname(order.to), {
										//	TODO	what's the right value for overwrite?
										overwrite: false,
										recursive: true
									});

								} else {
									extractTo(archive, order.to);
								}
								events.fire("installed", order.to);
							}
						}
					}
				}
			}
		}

		var wo = {
			/** @type { slime.jrunscript.tools.install.exports.Distribution["install"]["world"] } */
			install: function(p) {
				/** @param { slime.jrunscript.file.File } file */
				var getFileMimeType = function(file) {
					return getFilenameMimeType(file.pathname.basename);
				};

				/** @param { slime.jrunscript.http.client.Response } response */
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
				 * @param { (argument: slime.jrunscript.http.client.spi.Argument) => slime.jrunscript.http.client.Response } fetch
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
								true: $api.fp.impure.Output.compose([
									function(location) {
										events.fire("removing", location);
									},
									Location.remove.simple
								]),
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
					events.fire("installed", p.to);
				}
			}
		}

		$export({
			test: {
				getDefaultName: getDefaultName,
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
			},
			Cache: {
				from: {
					directory: function(it) {
						return components.downloads.directory(it)
					}
				}
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
				Format: formats,
				install: {
					world: wo.install
				},
				methods: {
					install: Distribution.methods.install
				}
			},
			get: deprecated.oldGet,
			//	TODO	find is completely untested
			find: deprecated.find,
			install: deprecated.newInstall,
			format: deprecated.formats,
			apache: scripts.apache({
				client: client,
				get: deprecated.oldGet,
				downloads: downloads
			}),
			zip: deprecated.zip,
			gzip: deprecated.gzip,
			rhino: {
				at: function(pathname) {
					var fileExists = $api.fp.pipe(
						$context.library.file.Location.from.os,
						$context.library.file.Location.file.exists.simple
					);

					if (fileExists(pathname)) {
						return $api.fp.Maybe.from.some({
							pathname: pathname.toString(),
							version: function() {
								var manifest = $context.library.install.jar.manifest.simple({
									pathname: pathname.toString()
								});
								var version = manifest.main["Implementation-Version"];
								return $api.fp.Maybe.from.value(version);
							}
						});
					} else {
						return $api.fp.Maybe.from.nothing();
					}
				}
			}
		})

	}
//@ts-ignore
)($api,$context,$loader,$export)
