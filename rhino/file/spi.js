var Filesystem = function(implementation) {
	this.Searchpath = function(array) {
		return new $context.Searchpath({ filesystem: implementation, array: array });
	}
	this.Searchpath.prototype = $context.Searchpath.prototype;
	this.Searchpath.parse = function(string) {
		if (!string) {
			throw new Error("No string to parse in Searchpath.parse");
		}
		var elements = string.split(implementation.SEARCHPATH_SEPARATOR);
		var array = elements.map(function(element) {
			return implementation.newPathname(element);
		});
		return new $context.Searchpath({ filesystem: implementation, array: array });
	}

	this.Pathname = function(string) {
		return implementation.newPathname(string);
	}

	this.$unit = new function() {
		//	Used by unit tests for getopts as well as unit tests for this module
		this.getSearchpathSeparator = function() {
			return implementation.SEARCHPATH_SEPARATOR;
		}
		this.getPathnameSeparator = function() {
			return implementation.PATHNAME_SEPARATOR;
		}
		this.temporary = function() {
			return implementation.temporary.apply(implementation,arguments);
		}
	}
}
Filesystem.Implementation = function() {
}
Filesystem.Implementation.canonicalize = function(string,separator) {
	var tokens = string.split(separator);
	var rv = [];
	for (var i=0; i<tokens.length; i++) {
		var name = tokens[i];
		if (name == ".") {
			//	do nothing
		} else if (name == "..") {
			rv.pop();
		} else {
			rv.push(name);
		}
	}
	return rv.join(separator);
}
$exports.Filesystem = Filesystem;
