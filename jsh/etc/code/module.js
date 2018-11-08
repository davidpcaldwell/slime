//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.source = new function() {
	this.endings = function(p) {
		if (p.eol == "\n") {
			if (p.string || typeof(p.string) == "string") {
				var lines = p.string.split("\n");
				var array = [];
				var matcher = /(.*)\r$/;
				lines.forEach(function(item) {
					if (matcher.exec(item)) {
						array.push(matcher.exec(item)[1]);
					} else {
						array.push(item);
					}
				});
				return array.join("\n");
			} else {
				throw new Error("Unknown format: p.string is missing.");
			}
		} else {
			throw new Error("Unimplemented: setting eol to " + p.eol);
		}
	}
}

$exports.files = new function() {
	//	TODO	probably need way to override these default excludes
	this.filter = function(node) {
		jsh.shell.console("Checking: " + node);
		if (node.pathname.basename == ".hg") return false;
		if (node.pathname.basename == ".hgtags") return false;
		if (node.pathname.basename == ".svn") return false;
		if (node.pathname.basename == "target") return false;
		//	TODO	next line breaks encapsulation of rhino/file/
		if (node.directory) return false;
		return true;
	}

	var isText = function(node) {
		var basename = node.pathname.basename;
		if (/\.txt$/.test(basename)) return true;
		if (/\.js$/.test(basename)) return true;
		if (/\.pac$/.test(basename)) return true;
		if (/\.jsh$/.test(basename)) return true;
		if (/\.bash$/.test(basename)) return true;
		if (/\.html$/.test(basename)) return true;
		if (/\.java$/.test(basename)) return true;
		if (/\.css$/.test(basename)) return true;
		if (/\.c$/.test(basename)) return true;
		if (/\.cpp$/.test(basename)) return true;
		if (/\.xml$/.test(basename)) return true;
		if (/\.properties$/.test(basename)) return true;
		if (/\.coffee$/.test(basename)) return true;
		if (/\.md/.test(basename)) return true;
		if (/\.wav$/.test(basename)) return false;
		//	TODO	if license.js has a license for the file, should always return true; we are repeating information
		if (/\.hgrc$/.test(basename)) return true;
	}

	this.isText = isText;

	this.forEachTextEntry = function(p) {
		if (!p.base) throw new Error("Required: base, specifying directory.");
		var entries = p.base.list({
//			recursive: true,
			filter: this.filter,
			descendants: function(directory) {
				jsh.shell.console("Checking directory: " + directory);
				return directory.pathname.basename != "local" && directory.pathname.basename != ".hg";
			},
			type: p.base.list.ENTRY
		});
		var isText = (p.isText) ? p.isText : arguments.callee.isText.extension;
		isText = jsh.js.Function.evaluator(
			isText,
			function(entry) {
				if (p.on && p.on.unknownFileType) {
					p.on.unknownFileType(entry);
				}
			}
		);
		var files = entries.filter(isText);
		files.forEach(p.entry);
	}
	this.forEachTextEntry.isText = new function() {
		this.extension = function(entry) {
			return isText(entry.node);
		};

		this.options = function(options) {
			var extensions = {};
			var specified = {};
			options.text.forEach(function(path) {
				if (path.substring(0,1) == ".") {
					extensions[path.substring(1)] = true;
				} else {
					specified[path] = true;
				}
			});
			options.binary.forEach(function(path) {
				if (path.substring(0,1) == ".") {
					extensions[path] = false;
				} else {
					specified[path] = false;
				}
			});
			return function(entry) {
				if (typeof(specified[entry.path]) != "undefined") return specified[entry.path];
				var extension = (function() {
					var tokens = entry.node.pathname.basename.split(".");
					if (tokens.length > 1) {
						return tokens[tokens.length-1];
					} else {
						return null;
					}
				})();
				if (extension && typeof(extensions[extension]) != "undefined") {
					return extensions[extension];
				}
			}
		}
	}

	this.endings = function(p) {
		this.forEachTextEntry({
			base: p.base,
			isText: p.isText,
			entry: function(entry) {
				var code = entry.node.read(String);
				var revised = $exports.source.endings({ eol: p.eol, string: code })
				if (code != revised) {
					p.on.changed(entry);
					if (!p.nowrite) {
						entry.node.pathname.write(revised, { append: false });
					}
				} else {
					p.on.unchanged(entry);
				}
			},
			on: {
				unknownFileType: (p.on && p.on.unknownFileType) ? p.on.unknownFileType : function(){}
			}
		});
	}

	this.trailingWhitespace = function(p) {
		this.forEachTextEntry({
			base: p.base,
			isText: p.isText,
			entry: function(entry) {
				var code = entry.node.read(String);
				var ending = "\n";
				if (code.indexOf("\r\n") != -1) {
					ending = "\r\n";
				}
				var lines = [];
				var changed = false;
				entry.node.read(jsh.io.Streams.text).readLines(function(line) {
					var rv = line;
					var match;
					if (match = /(.*?)\s+$/.exec(line)) {
						p.on.change({
							path: entry.path,
							line: {
								number: lines.length+1,
								content: line
							}
						});
						rv = match[1];
					}
					lines.push(rv);
					if (rv != line) {
						changed = true;
					}
				}, { ending: ending });
				if (changed) {
					p.on.changed(entry);
					if (!p.nowrite) {
						entry.node.pathname.write(lines.join(ending), { append: false });
					}
				} else {
					p.on.unchanged(entry);
				}
			},
			on: {
				unknownFileType: (p.on && p.on.unknownFileType) ? p.on.unknownFileType : function(){}
			}
		});
	}
}
