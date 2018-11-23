//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jrunscript/io SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.Streams = $context.$slime.io.Streams;

$exports.Buffer = $context.$slime.io.Buffer;

$exports.Resource = $context.$slime.Resource;

$exports.Loader = $context.$slime.Loader;

$exports.java = new function() {
	this.adapt = function(object) {
		if (false) {
		} else if ($context.api.java.isJavaObject(object) && $context.api.java.isJavaType(Packages.java.io.InputStream)(object)) {
			return new $context.$slime.io.InputStream(object);
		} else if ($context.api.java.isJavaObject(object) && $context.api.java.isJavaType(Packages.java.io.OutputStream)(object)) {
			return new $context.$slime.io.OutputStream(object);
		} else if ($context.api.java.isJavaObject(object) && $context.api.java.isJavaType(Packages.java.io.Reader)(object)) {
			return new $context.$slime.io.Reader(object);
		} else if ($context.api.java.isJavaObject(object) && $context.api.java.isJavaType(Packages.java.io.Writer)(object)) {
			return new $context.$slime.io.Writer(object);
		} else {
			var type = (function() {
				if (object.getClass) {
					return " (Java class: " + object.getClass().getName() + ")";
				}
				var rv = " typeof=" + typeof(object);
				var props = [];
				for (var x in object) {
					props.push(x);
				}
				rv += " properties=" + props.join(",");
				return rv;
			})();
			throw new Error("Unimplemented java.adapt: " + type + object);
		}
	};
};

$exports.mime = $loader.file("mime.js", {
	nojavamail: $context.nojavamail,
	$slime: {
		mime: $context.$slime.mime
	},
	api: {
		java: $context.api.java,
		io: $exports
	}
});

$exports.archive = {
	zip: $loader.file("zip.js", {
		InputStream: $context.$slime.io.InputStream,
		Streams: $context.$slime.io.Streams
	})
};
