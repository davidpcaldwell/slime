//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the rhino/shell SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if (!$context.api || !$context.api.document) {
	throw new Error("Required: $context.api.document");
}

//	//	Apple documentation on Mac OS X filesystem hierarchy
//	https://developer.apple.com/library/mac/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/FileSystemOverview/FileSystemOverview.html
var isArray = function(object) {
	if (typeof(object.length) == "number" && typeof(object.splice) == "function") return true;
	return false;
}

$exports.Plist = function(v) {
	//	https://developer.apple.com/library/ios/documentation/Cocoa/Conceptual/PropertyLists/AboutPropertyLists/AboutPropertyLists.html
	var Value = function(v) {
		if (typeof(v) == "object") {
			if (isArray(v)) {
				throw new TypeError("Unimplemented.");
			} else {
				var rv = new $context.api.document.Element({
					type: {
						name: "dict"
					}
				});
				for (var x in v) {
					if (typeof(v[x]) == "undefined") {
						//	TODO	what happens? Looks like the property should be omitted.
					} else if (v[x] === null) {
						//	TODO	what happens? Looks like the property should be omitted.
					} else if (typeof(v[x]) == "string") {
						var key = new $context.api.document.Element({ type: { name: "key" } });
						//	TODO	document use of new Text() in slime/js/document/api.html
						key.children.push(new $context.api.document.Text({ text: x }));
						rv.children.push(key);
						rv.children.push(new Value(v[x]));
					}
				}
				return rv;
			}
		} else if (typeof(v) == "string") {
			var rv = new $context.api.document.Element({ type: { name: "string" } });
			rv.children.push(new $context.api.document.Text({ text: v }));
			return rv;
		} else {
			throw new TypeError("v = " + v + " typeof(v) = " + typeof(v));
		}
	};

	var document = new $context.api.document.Document();
	var root = new $context.api.document.Element({
		type: {
			name: "plist"
		}
	});
	document.children.push(root);
	root.element.attributes.set("version", "1.0");
	root.children.push(new Value(v));

	this.serialize = function() {
		return document.serialize.apply(document,arguments);
	}
}

//	Bundle programming guide
//	https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/Introduction/Introduction.html
$exports.bundle = {};
$exports.bundle.osx = function(p) {
	var info = $context.api.js.Object.set({}, p.info);

	if (p.command) {
		this.command = p.command;
		if (!info.CFBundleExecutable) {
			info.CFBundleExecutable = "script";
		}
	}

	this.write = function(to) {
		var contents = to.getRelativePath("Contents").createDirectory({
			ifExists: function(dir) {
				return false;
			}
		});
		contents.getRelativePath("Info.plist").write(new $exports.Plist(info).serialize({ pretty: { current: "\n", indent: "    " } }));
		if (p.command) {
			var path = "MacOS/" + info.CFBundleExecutable;
			contents.getRelativePath(path).write("#!/bin/bash\n" + p.command, { append: false, recursive: true });
			if ($context.api.shell.shell.length == 1) {
				$context.api.shell.shell({
					command: "chmod",
					arguments: ["+x", contents.getRelativePath(path)]
				});
			} else {
				//	jsh 0.0.4.7 compatibility
				$context.api.shell.shell(
					"chmod",
					["+x", contents.getRelativePath(path)]
				);
			}
		}
	}
};

