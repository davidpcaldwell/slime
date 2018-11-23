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

var InputStream = function(peer) {
	$context.$slime.io.InputStream.apply(this,arguments);

	var _readBytes = this.java.array;

	//	TODO	push back into loader/jrunscript
	this.Resource = function(type) {
		var _bytes = _readBytes();
		return new $context.$slime.Resource(new function() {
			this.type = type;

			this.read = new function() {
				this.binary = function() {
					return new InputStream(new Packages.java.io.ByteArrayInputStream(_bytes));
				}
			}
		});
	};

	this.cache = $api.deprecate(function() {
		return new this.Resource();
	});
};

$exports.Streams = $context.$slime.io.Streams;

$exports.Buffer = function() {
	$context.$slime.io.Buffer.apply(this,arguments);

	this.readBinary = (function(was) {
		return function() {
			var underlying = was.apply(this,arguments);
			return new InputStream(underlying.java.adapt());
		};
	})(this.readBinary);
};

$exports.Resource = $context.$slime.Resource;

$exports.Loader = $context.$slime.Loader;

$exports.java = new function() {
	this.adapt = function(object) {
		if (false) {
		} else if ($context.api.java.isJavaObject(object) && $context.api.java.isJavaType(Packages.java.io.InputStream)(object)) {
			return new InputStream(object);
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
		InputStream: InputStream,
		Streams: $context.$slime.io.Streams
	})
};
