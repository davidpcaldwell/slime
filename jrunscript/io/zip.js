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
	 * @param { slime.jrunscript.io.zip.Context } $context
	 * @param { slime.jrunscript.io.zip.Exports } $exports
	 */
	function(Packages,$api,$context,$exports) {
		var _streams = new Packages.inonit.script.runtime.io.Streams();

		/**
		 * @type { (p: slime.jrunscript.io.archive.Entry<{}>) => p is slime.jrunscript.io.archive.File<{}> }
		 */
		var isFileEntry = function(p) {
			return Boolean(p["content"]);
		}

		$exports.encode = function(p) {
			var _out = p.to.java.adapt();

			//	TODO	(Possibly obsolete comment) Much of this logic is reproduced in the jsh build process
			var zipOutputStream = new function() {
				var peer = new Packages.java.util.zip.ZipOutputStream(_out);

				this.close = function() {
					peer.close();
				}

				var cachedDirectories = {};

				var directoryNameFor = function(path) {
					var directoryIndex = path.lastIndexOf("/");
					if (directoryIndex != -1) {
						var directoryName = path.substring(0,directoryIndex);
						return directoryName;
					}
					return null;
				}

				var createDirectory = function(directoryName) {
					if (directoryName != null) {
						createDirectory( directoryNameFor(directoryName) );
						if (!cachedDirectories[directoryName]) {
							cachedDirectories[directoryName] = true;
							var entry = new Packages.java.util.zip.ZipEntry(directoryName + "/");
							peer.putNextEntry(entry);
							peer.closeEntry();
							// zipOutputStream.addDirectory(directoryName);
						}
					}
				}

				this.addDirectory = function(name) {
					createDirectory(name);
					// var entry = new Packages.java.util.zip.ZipEntry(name + "/");
					// peer.putNextEntry(entry);
					// peer.closeEntry();
				}

				/**
				 *
				 * @param { slime.jrunscript.io.archive.File<slime.jrunscript.io.zip.Entry> } file
				 */
				this.addEntry = function(file) {
					createDirectory(directoryNameFor(file.path));
					var entry = new Packages.java.util.zip.ZipEntry(file.path);
					if (file.time.modified.present) {
						entry.setLastModifiedTime(Packages.java.nio.file.attribute.FileTime.fromMillis(file.time.modified.value));
					}
					if (file.time.created.present) {
						entry.setCreationTime(Packages.java.nio.file.attribute.FileTime.fromMillis(file.time.created.value));
					}
					if (file.time.accessed.present) {
						entry.setLastAccessTime(Packages.java.nio.file.attribute.FileTime.fromMillis(file.time.accessed.value));
					}
					peer.putNextEntry(entry);
					$context.Streams.binary.copy(file.content, peer);
					peer.closeEntry();
				}
			};

			$api.fp.now(
				p.entries,
				$api.fp.impure.Stream.forEach(function(entry) {
					if (isFileEntry(entry)) {
						zipOutputStream.addEntry(entry);
					}
				})
			);

			zipOutputStream.close();
		};

		$exports.decode = function(p) {
			var _zipstream = new Packages.java.util.zip.ZipInputStream(p.stream.java.adapt());
			var entry;
			/** @type { slime.jrunscript.io.archive.Entry<slime.jrunscript.io.zip.Entry>[] } */
			var array = [];
			while( (entry = _zipstream.getNextEntry()) != null ) {
				var name = String(entry.getName());
				/** @type { (time: slime.jrunscript.native.java.nio.file.attribute.FileTime) => slime.$api.fp.Maybe<number> } */
				var fileTimeToMaybe = function(value) {
					if (value === null) return $api.fp.Maybe.from.nothing();
					return $api.fp.Maybe.from.some(value.toMillis());
				}
				if (name.substring(name.length-1) == "/") {
					array.push({
						path: name.substring(0,name.length-1),
						time: {
							modified: fileTimeToMaybe(entry.getLastModifiedTime()),
							created: fileTimeToMaybe(entry.getCreationTime()),
							accessed: fileTimeToMaybe(entry.getLastAccessTime())
						},
						comment: $api.fp.Maybe.from.value(entry.getComment())
					});
				} else {
					var _bytes = _streams.readBytes(_zipstream, false);
					array.push({
						path: name,
						time: {
							modified: fileTimeToMaybe(entry.getLastModifiedTime()),
							created: fileTimeToMaybe(entry.getCreationTime()),
							accessed: fileTimeToMaybe(entry.getLastAccessTime())
						},
						comment: $api.fp.Maybe.from.value(entry.getComment()),
						content: $context.InputStream(new Packages.java.io.ByteArrayInputStream(_bytes))
					});
				}
			}
			return $api.fp.Stream.from.array(array);
		};
	}
//@ts-ignore
)(Packages,$api,$context,$exports);
