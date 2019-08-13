var NodeList = function() {
	var array = [];

	this.get = function(index) {
		return array[index];
	}

	Object.defineProperty(this, "length", {
		get: function() {
			return array.length;
		}
	});

	this.add = function(node) {
		array.push(node);
	};

	this.map = function(f,target) {
		return array.map(f,target);
	}
}

var Parent = function() {
	var list = new NodeList();

	Object.defineProperty(this, "children", {
		get: function() {
			return list;
		}
	});
}

var Document = function() {
	Parent.call(this);

	this.serialize = function() {
		return this.children.map(function(child) {
			return child.serialize();
		}).join("");
	}
};

var Doctype = function() {
	this.serialize = function() {
		return "<!DOCTYPE " + this.name + ">";
	}
};

var Position = function(string) {
	var index = 0;

	this.startsWith = function(prefix) {
		return string.substring(index,index+prefix.length) == prefix;
	};

	this.skip = function(prefix) {
		if (!this.startsWith(prefix)) throw new Error();
		index += prefix.length;
	};

	this.consume = function() {
		var rv = string.substring(index,index+1);
		index++;
		return rv;
	};

	this.more = function() {
		return index < string.length;
	};

	this.debug = new function() {
		this.rest = function() {
			return string.substring(index);
		};

		this.finish = function() {
			index = string.length;
		};	
	}
}

var states = new function() {
	this.document = function(p) {
		var rv = new Document();
		var position = new Position(p.string);
		while(position.more()) {
			if (position.startsWith(states.doctype.prefix)) {
				rv.children.add(states.doctype({ position: position }));
				position.debug.finish();
			} else {
				throw new Error("Unknown state: rest=" + position.debug.rest())
			}
		}
		return rv;
	};

	this.doctype = function(p) {
		p.position.skip(states.doctype.prefix);
		//	does not deal with publicId, systemId
		var rv = new Doctype();
		rv.name = states.doctype._name({ position: p.position });
		return rv;
	};
	this.doctype.prefix = "<!DOCTYPE ";
	this.doctype._name = function(p) {
		var rv = "";
		while(!p.position.startsWith(">")) {
			rv += p.position.consume();
		}
		p.position.skip(">");
		return rv;
	};
}

var parse = function(configuration,string) {
	return states.document({ string: string });
}

var Parser = function(configuration) {
	this.parse = function(string) {
		return parse(configuration, string);
	}
}

$exports.parse = function(string) {
	return new Parser().parse(string);
}