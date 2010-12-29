//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the rhino/file SLIME module.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

$exports.zip = function(p) {
	var from;

	if (p.from instanceof Array) {
		from = p.from;
	} else if (p.from instanceof $context.Pathname && p.from.directory) {
		//	TODO	Should really allow p.from to *be* a directory
		from = p.from.directory.list({ recursive: true, type: p.from.directory.list.ENTRY }).map( function(item) {
			if (item.node.directory) return { directory: item.path };
			return {
				path: item.path.replace(/\\/g, "/"),
				$stream: item.node.read($context.Streams.binary).$getInputStream()
			};
		});
	} else if (p.from instanceof $context.Pathname && p.from.file) {
		throw "Unimplemented: from file";
	} else {
		throw "Unimplemented: from " + p.from;
	}

	var $getInputStream = function(item) {
		if (item.$stream) return item.$stream;
		throw "Unimplemented: item lacks input stream: " + item;
	}

	var $to;

	if (p.to instanceof $context.Pathname) {
		$to = p.to.write($context.Streams.binary, { append: false }).$getOutputStream();
	} else if (p.to.$getOutputStream) {
		$to = p.to.$getOutputStream();
	} else {
		debugger;
		throw "Unimplemented: to " + p.to;
	}

	//	TODO	Much of this logic is reproduced in a native Rhino shell script used in the jsh build process
	var zipOutputStream = new function() {
		var peer = new Packages.java.util.zip.ZipOutputStream($to);

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
		}
	};

	for (var i=0; i<from.length; i++) {
		//	TODO	Clean this up; this API is not right, just convenient to use for the two use cases in admin project and
		//			slime.jsh for now
		if (!from[i].directory) {
			zipOutputStream.addEntry(from[i].path,$getInputStream(from[i]));
		} else {
			zipOutputStream.addDirectory(from[i].directory);
		}
	}
	zipOutputStream.close();
}

$exports.unzip = function(p) {
	var _zipstream = new Packages.java.util.zip.ZipInputStream(p.zip.read($context.Streams.binary).$getInputStream());
	var entry;
	while( (entry = _zipstream.getNextEntry()) != null ) {
		var name = String(entry.getName());
		if (name.substring(name.length-1) == "/") {
			p.to.getRelativePath(name.substring(name.length-1)).createDirectory({ ifExists: function(d) { return false; }});
		} else {
			p.to.getRelativePath(entry.getName()).write(new $context.InputStream(_zipstream), { append: false, recursive: true });
		}
	}
}