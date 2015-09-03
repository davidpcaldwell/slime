//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/io SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	rename this
var _java = ($context.$java) ? $context.$java : new Packages.inonit.script.runtime.io.Streams();

var Resource = $context.$rhino.io.Resource;
var InputStream = function(peer) {
	$context.$rhino.io.InputStream.apply(this,arguments);

	this.asProperties = function() {
		var properties = new Packages.java.util.Properties();
		properties.load( peer );
		peer.close();
		return $context.api.java.Properties.adapt(properties);
	}

	this.Resource = function(type) {
		var _bytes = _java.readBytes(peer);
		return new Resource(new function() {
			this.type = type;

			this.read = new function() {
				this.binary = function() {
					return new InputStream(new Packages.java.io.ByteArrayInputStream(_bytes));
				}
			}
		});
	};

	this.cache = $api.deprecate(function() {
		var $bytes = _java.readBytes(peer);
		return new Resource(new function() {
			this.read = new function() {
				this.binary = function() {
					return new InputStream(new Packages.java.io.ByteArrayInputStream($bytes));
				}
			}
		});
	});

};

var OutputStream = $context.$rhino.io.OutputStream;

var Reader = $context.$rhino.io.Reader;
var Writer = $context.$rhino.io.Writer;
var Buffer = $context.$rhino.io.Buffer;

$exports.Streams = $context.$rhino.io.Streams;
if ($context.stdio) {
	(function() {
		var StandardOutputStream = function(_peer) {
			var rv = new OutputStream(_peer);
			rv.write = function(message) {
				var _writer = new Packages.java.io.OutputStreamWriter(_peer);
				_writer.write(message);
				_writer.flush();
			};
			delete rv.close;
			return rv;
		}

		this.stderr = StandardOutputStream($context.stdio.$err);
		this.stdout = StandardOutputStream($context.stdio.$out);
	}).call($exports.Streams);
}

$exports.Buffer = function() {
	Buffer.apply(this,arguments);

	this.readBinary = (function(was) {
		return function() {
			var underlying = was.apply(this,arguments);
			return new InputStream(underlying.java.adapt());
		};
	})(this.readBinary);
};
$exports.Streams.binary.Buffer = $exports.Buffer;

$exports.java = new function() {
	this.adapt = function(object) {
		if (false) {
		} else if ($context.api.java.isJavaObject(object) && $context.api.java.isJavaType(Packages.java.io.InputStream)(object)) {
			return new InputStream(object);
		} else if ($context.api.java.isJavaObject(object) && $context.api.java.isJavaType(Packages.java.io.OutputStream)(object)) {
			return new OutputStream(object);
		} else if ($context.api.java.isJavaObject(object) && $context.api.java.isJavaType(Packages.java.io.Reader)(object)) {
			return new Reader(object);
		} else if ($context.api.java.isJavaObject(object) && $context.api.java.isJavaType(Packages.java.io.Writer)(object)) {
			return new Writer(object);
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
			throw "Unimplemented java.adapt: " + type + object;
		}
	};
}

//	TODO	It may be that the following exports are not necessary and can actually all be accessed through java.adapt
$exports.Reader = Reader;
$exports.Writer = Writer;
$exports.InputStream = InputStream;
$exports.OutputStream = OutputStream;
$exports.Resource = Resource;

var Loader = function(underlying) {
	return function(p) {
		underlying.apply(this,arguments);
		//	TODO	NASHORN	decorate.call(this,p) did not work as p was somehow null
		this.resource = function(path) {
			var gotten = p.get(path);
			if (!gotten) return null;
			return gotten.resource;
		};
	};
};

$exports.Loader = Loader($context.$rhino.Loader);

$exports.mime = $loader.file("mime.js", {
	_streams: _java,
	nojavamail: $context.nojavamail,
	api: {
		java: $context.api.java,
		mime: $context.api.mime,
		io: $exports
	}
});