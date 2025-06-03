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
				 * @param { string } name
				 * @param { slime.jrunscript.runtime.io.InputStream } $stream
				 */
				this.addEntry = function(name,$stream) {
					createDirectory(directoryNameFor(name));
					var entry = new Packages.java.util.zip.ZipEntry(name);
					peer.putNextEntry(entry);
					$context.Streams.binary.copy($stream, peer);
					peer.closeEntry();
					$stream.close();
				}
			};

			$api.fp.now(
				p.entries,
				$api.fp.impure.Stream.forEach(function(entry) {
					if (isFileEntry(entry)) {
						zipOutputStream.addEntry(entry.path, entry.content);
					}
				})
			);

			for (var i=0; i<p.entries.length; i++) {
				zipOutputStream.addEntry(p.entries[i].path,p.entries[i].content());
			}

			zipOutputStream.close();
		};

		$exports.decode = function(p) {
			var _zipstream = new Packages.java.util.zip.ZipInputStream(p.stream.java.adapt());
			var entry;
			/** @type { slime.jrunscript.io.archive.Entry<slime.jrunscript.io.zip.Entries>[] } */
			var array = [];
			while( (entry = _zipstream.getNextEntry()) != null ) {
				var name = String(entry.getName());
				if (name.substring(name.length-1) == "/") {
					array.push({
						path: name.substring(0,name.length-1),
						time: {
							modified: entry.getTime
						}
					});
				} else {
					var _bytes = _streams.readBytes(_zipstream, false);
					array.push({
						path: name,
						time: {
							modified: entry.getTime
						},
						content: $context.InputStream(new Packages.java.io.ByteArrayInputStream(_bytes))
					});
				}
			}
			return $api.fp.Stream.from.array(array);
		};
	}
//@ts-ignore
)(Packages,$api,$context,$exports);
