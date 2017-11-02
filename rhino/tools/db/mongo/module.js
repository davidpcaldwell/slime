//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var _wrap = function(o) {
	if (!o) return null;
	var _rv = new Packages.com.mongodb.BasicDBObject();
	for (var x in o) {
		if (typeof(o[x]) != "undefined") {
			_rv.put(x, o[x]);
		}
	}
	return _rv;
}

var _unwrap = function(o) {
	try {
		//	TODO	neither Mongo shell nor Java driver correctly escapes this character
		return eval("(" + String(o).replace("\u2029","\\u2029","g") + ")");
	} catch (e) {
		var _set = o.keySet();
		var _iterator = _set.iterator();
		while(_iterator.hasNext()) {
			var _key = _iterator.next();

		}
		var jsstring = String(o);
		var codes = [];
//		for (var i=0; i<jsstring.length; i++) {
//			var code = jsstring.charCodeAt(i);
//			if (code > 255) {
//				jsh.shell.echo("Warning: code = " + code);
//			}
//			codes.push(code);
//		}
//		jsh.shell.echo("codes = " + codes);
//		jsh.shell.echo("selectedText = [" + jsh.js.toLiteral(String(o.get("selectedText"))) + "]");
//		var _string = o.get("selectedText");
//		for (var i=0; i<_string.length(); i++) {
//			jsh.shell.echo(String(i) + ":[" + _string.charAt(i) + "]/" + Packages.java.lang.String.valueOf(new Packages.java.lang.Character(_string.charAt(i))));
//		}
		throw new TypeError("Could not unwrap: (" + String(o) + ")");
	}
}

var Cursor = function(_collection,criteria,projection) {
	if (arguments.length < 1) criteria = {};
	if (arguments.length < 2) projection = {};

	var limit;

	this.limit = function(n) {
		limit = n;
		return this;
	}

	var peer = function() {
		var _cursor = _collection.find(_wrap(criteria),_wrap(projection));
		if (typeof(limit) != "undefined") _cursor = _cursor.limit(limit);
		return _cursor;
	}

	this.count = function() {
		return peer().count();
	}

	this.size = function() {
		return peer().size();
	}

	this.forEach = function(f) {
		var _iterator = peer().iterator();
		while(_iterator.hasNext()) {
			var _wrapped = _iterator.next();
			f.call(null,_unwrap(_wrapped));
		}
	}

	this.toArray = function() {
		var _descriptors = peer().toArray().toArray();
		var descriptors = $context.api.java.Array.adapt(_descriptors).map(_unwrap);
//		var descriptors = $context.api.java.toJsArray(_descriptors, _unwrap);
		return descriptors;
	}

	this.one = function() {
		var _iterator = peer().iterator();
		if (_iterator.hasNext()) return _unwrap(_iterator.next());
		return null;
	}
};

var Collection = function(_db,name) {
	this.name = name;

	this.find = function(criteria,projection) {
		return new Cursor(_db.getCollection(name),criteria,projection);
	};
	
	this.findOne = function(criteria,projection) {
		var rv = _db.getCollection(name).findOne(_wrap(criteria),_wrap(projection));
		return _unwrap(rv);
	}

	this.distinct = function(field) {
		var _rv = _db.getCollection(name).distinct(field);
		var rv = [];
		for (var i=0; i<_rv.size(); i++) {
			if (_rv.get(i).getClass().getName().equals("java.lang.String")) {
				rv[i] = String(_rv.get(i));
			} else {
				throw new Error("Unsupported Java type: " + _rv.get(i).getClass());
			}
		}
		return rv;
	};

	this.drop = function() {
		_db.getCollection(name).drop();
		//	TODO	should probably invalidate this object
	};

	this.count = function() {
		if (arguments.length != 0) throw new TypeError("Not supported yet: arguments to count");
		return _db.getCollection(name).count();
	}

	this.insert = function(object) {
		_db.getCollection(name).insert(_wrap(object));
	}

	this.save = function(object) {
		_db.getCollection(name).save(_wrap(object));
	}
};

//	Corresponds to the Mongo shell 'db' object
//	TODO	Mongo shell also allows db.<collection name> but we would need a custom host object to do that consistently
//	TODO	as partial solution for the above, could iterate over names on connection and only reflect local changes to names
var Database = function(_db) {
	this.name = String(_db.getName());
	
	this.auth = function(username,password) {
		//	TODO	uses deprecated call from 2.14
		_db.authenticate(username,new Packages.java.lang.String(password).toCharArray());
	};
	
	this.getCollectionNames = function() {
		var _names = _db.getCollectionNames();
		var rv = [];
		var _iterator = _names.iterator();
		while(_iterator.hasNext()) {
			rv.push(
				String(_iterator.next())
			);
		}
		return rv;
	}

	this.getCollection = function(name) {
		return new Collection(_db,name);
	};

	this.createCollection = function(name,options) {
		_db.createCollection(name,_wrap(options));
		return new Collection(_db,name);
	}

	this.dropDatabase = function() {
		_db.dropDatabase();
	}
	
	var rs = new function() {
		this.slaveOk = function() {
			//	TODO	uses deprecated call from 2.14; supposed to switch to ReadPreference
			_db.slaveOk();
		}
	}

	this.script = function(p) {
		var scope = {
			db: this,
			printjson: function(o) {
				jsh.shell.echo(JSON.stringify(o,void(0),"    "));
			},
			print: function(s) {
				jsh.shell.echo(s);
			},
			rs: rs
		};
		if (p.scope) {
			p.scope(scope);
		}
		jsh.loader.run(p.file.pathname, scope);
	}
}

$exports.Client = function(p) {
	//	See ServerAddress documentation for defaults given below; probably should call the driver to get them
	if (!p) p = {};

	var _Address = function(p) {
		var host = (function(host,server) {
			if (host) return host;
			if (server) return server;
			return "127.0.0.1";
		})(p.host,p.server);
		var port = (typeof(p.port) == "undefined") ? 27017 : p.port;
		return new Packages.com.mongodb.ServerAddress(host,port);
	};

	var _address;
	var _addresses;
	if (p.seeds) {
		_addresses = new Packages.java.util.ArrayList();
		p.seeds.forEach(function(address) {
			_addresses.add(new _Address(address));
		});
	} else {
		_address = new _Address(p);
	}
	var _options = new Packages.com.mongodb.MongoClientOptions.Builder();
	if (p._options) {
		p._options.call(this, _options);
	}
	if (p.replica) {
		_options.readPreference(Packages.com.mongodb.ReadPreference.secondaryPreferred());
	}
	var _argument = (_addresses) ? _addresses : _address;
	var mongoClient = new Packages.com.mongodb.MongoClient(_argument, _options.build());

	return new function() {
		this.databases = function() {
			var _names = mongoClient.getDatabaseNames();
			var rv = [];
			for (var i=0; i<_names.size(); i++) {
				rv.push(
					new Database( mongoClient.getDB(_names.get(i)) )
				);
			}
			return rv;
		};

		this.connect = function(p) {
			if (p.database) {
				var _db = mongoClient.getDB(p.database);
				if (p.credentials) {
					var authenticated = _db.authenticate(p.credentials.user,new Packages.java.lang.String(p.credentials.password).toCharArray());
					if (!authenticated) throw new Error("Authentication failure to database " + p.database);
				}
				return new Database(_db);
			}
		}
	}
};

$exports.Database = function(p) {
	var client = new $exports.Client(p);
	return client.connect(p);
}