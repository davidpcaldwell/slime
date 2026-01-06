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
	 * @param { slime.jrunscript.tools.install.deprecated.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.install.deprecated.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 *
		 * @param { slime.jrunscript.http.client.request.url } p
		 */
		var urlToString = function(p) {
			if (typeof(p) == "string") return p;
			return $context.library.web.Url.codec.string.encode(p);
		}

		/**
		 * @param { slime.jrunscript.tools.install.old.WorldSource } p
		 * @param { slime.$api.event.Producer<{ console: string }> } events
		 */
		var get = function(p,events) {
			//	TODO	If typeof(p.file) is undefined, probably should try to use user downloads directory with p.name if present as default value
			if (!p.file) {
				if (p.url) {
					//	Apache supplies name so that url property, which is getter that hits Apache mirror list, is not invoked
					if (!p.name) p.name = $context.getDefaultName(p.url);
					var pathname = $context.downloads.getRelativePath(p.name);
					if (!pathname.file) {
						//	TODO	we could check to make sure this URL is http
						//	Only access url property once because in Apache case it is actually a getter that can return different values
						events.fire("console", "Downloading from " + p.url + " to: " + $context.downloads);
						var response = $context.client.request({
							url: p.url
						});
						pathname.write(response.body.stream, { append: false });
						events.fire("console", "Wrote to: " + $context.downloads);
					} else {
						events.fire("console", "Found " + pathname.file + "; using cached version.");
					}
					p.file = pathname.file.toString();
				}
			}
			return p;
		};

		var oldGet = $api.events.Function(
			/**
			 *
			 * @param { slime.jrunscript.tools.install.old.Source } p
			 * @param { slime.$api.event.Producer<slime.jrunscript.tools.install.old.events.Console> } events
			 */
			function(p,events) {
				/**
				 *
				 * @param { slime.jrunscript.tools.install.old.Source } oldSource
				 * @returns { slime.jrunscript.tools.install.old.WorldSource }
				 */
				var toWorldSource = function(oldSource) {
					return {
						url: (oldSource.url) ? urlToString(oldSource.url) : void(0),
						name: oldSource.name,
						file: (oldSource.file) ? oldSource.file.toString() : void(0)
					}
				}

				var source = toWorldSource(p);
				get(source,events);
				return $context.library.file.Pathname(source.file).file;
			}
		);

		/** @type { { gzip?: slime.jrunscript.tools.install.old.Format, zip: slime.jrunscript.tools.install.old.Format }} */
		var formats = (
			function() {
				var format = {
					zip: {
						getDestinationPath: $context.getPrefix.zip,
						extract: $context.extract.zip
					}
				};

				if ($context.extract.gzip) format.gzip = {
					getDestinationPath: $context.getPrefix.gzip,
					extract: $context.extract.gzip
				};

				return format;
			}
		)();

		/**
		 * @param { { name?: string, getDestinationPath?: (file: slime.jrunscript.file.File) => string, url?: any, file?: slime.jrunscript.file.File, format?: slime.jrunscript.tools.install.old.Format, to: slime.jrunscript.file.Pathname, replace?: boolean } } p
		 * @param { slime.$api.event.Producer<{ console: string }> } events
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
		 * @param { slime.$api.event.Producer<{ console: string }> } events
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

		$export({
			oldGet: oldGet,
			find: function(p) {
				return $api.fp.world.old.ask(function(events) {
					get(p,events);
					return p.file;
				});
			},
			//	TODO	just cannot get the TypeScript right with unrelated return types and the set of parameters we have
			//@ts-ignore
			newInstall: function(p,events) {
				/** @type { (p: slime.jrunscript.tools.install.old.WorldInstallation) => slime.$api.fp.world.old.Tell<slime.jrunscript.tools.install.old.events.Console> } */
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

				/** @type { (p: any) => p is slime.jrunscript.tools.install.old.Installation } */
				var isOld = function(p) { return Boolean(p["url"]) || Boolean(p["name"]) || Boolean(p["file"]); };
				if (isOld(p)) {
					return oldInstall(p,events);
				} else {
					return newOldInstall(p);
				}
			},
			formats: formats,
			gzip: ($context.extract.gzip) ? $api.deprecate(function(p,on) {
				p.format = {
					getDestinationPath: $context.getPrefix.gzip,
					extract: $context.extract.gzip
				};
				oldInstall(p,on);
			}) : void(0),
			zip: $api.deprecate(function(p,on) {
				p.format = {
					getDestinationPath: $context.getPrefix.zip,
					extract: $context.extract.zip
				};
				oldInstall(p,on);
			})
		});
	}
//@ts-ignore
)($api,$context,$export);
