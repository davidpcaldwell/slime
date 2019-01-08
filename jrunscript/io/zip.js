//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jrunscript/io SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2017 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.encode = function(p) {
//	var from;
//
//	var fromDirectory = function(directory) {
//		return directory.list({
//			filter: function(node) { return true; },
//			descendants: function(dir) { return true; },
//			type: directory.list.ENTRY
//		}).map( function(item) {
//			if (item.node.directory) return { directory: item.path.substring(0,item.path.length-1).replace(/\\/g, "/") };
//			var rv = {
//				path: item.path.replace(/\\/g, "/")//,
//				//$stream: item.node.read($context.Streams.binary).java.adapt()
//			};
//			rv.__defineGetter__("$stream", function() {
//				return item.node.read($context.Streams.binary).java.adapt();
//			});
//			return rv;
//		});
//	}
//
//	if (p.from instanceof Array) {
//		from = p.from;
//	} else if (p.from instanceof $context.Pathname && p.from.directory) {
//		from = fromDirectory(p.from.directory);
//	} else if (p.from.pathname && p.from.pathname.directory) {
//		from = fromDirectory(p.from);
//	} else if (p.from instanceof $context.Pathname && p.from.file) {
//		throw new Error("Unimplemented: from file");
//	} else {
//		throw new Error("Unimplemented: from " + p.from);
//	}

//	var _getInputStream = function(item) {
//		if (item.stream) return item.stream.java.adapt();
//		var _stream = item.$stream;
//		if (_stream) return _stream;
//		if (item.node && item.node.read($context.Streams.binary)) return item.node.read($context.Streams.binary).java.adapt();
//		throw new Error("Unimplemented: item lacks input stream: " + item + " [" + item.directory + "]");
//	}
//
//	var $to;
//
//	if (p.to instanceof $context.Pathname) {
//		$to = p.to.write($context.Streams.binary, { append: false }).java.adapt();
//	} else if (p.to.java && p.to.java.adapt) {
//		//	TODO	should do a type check here
//		$to = p.to.java.adapt();
//	} else {
//		debugger;
//		throw new Error("Unimplemented: to " + p.to);
//	}
	var _out = p.stream.java.adapt();

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
//					zipOutputStream.addDirectory(directoryName);
				}
			}
		}

		this.addDirectory = function(name) {
			createDirectory(name);
//			var entry = new Packages.java.util.zip.ZipEntry(name + "/");
//			peer.putNextEntry(entry);
//			peer.closeEntry();
		}

		this.addEntry = function(name,$stream) {
			createDirectory(directoryNameFor(name));
			var entry = new Packages.java.util.zip.ZipEntry(name);
			peer.putNextEntry(entry);
			$context.Streams.binary.copy($stream, peer);
			peer.closeEntry();
			$stream.close();
		}
	};

	for (var i=0; i<p.entries.length; i++) {
		zipOutputStream.addEntry(p.entries[i].path,p.entries[i].resource.read($context.Streams.binary));
	}

	zipOutputStream.close();
};

$exports.decode = function(p) {
	var _zipstream = new Packages.java.util.zip.ZipInputStream(p.stream.java.adapt());
	var entry;
	while( (entry = _zipstream.getNextEntry()) != null ) {
		var name = String(entry.getName());
		if (name.substring(name.length-1) == "/") {
			p.output.directory({ path: name.substring(0,name.length-1) });
		} else {
			$context.Streams.binary.copy(
				new $context.InputStream(_zipstream),
				p.output.file({ path: name }),
				{
					onFinish: function(_r,_w) {
						_w.close();
					}
				}
			);
		}
	}
};
