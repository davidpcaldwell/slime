var IsString = function(p) {
	var reference = (p.name) ? "arguments[" + p.index + "]" : "arguments[" + p.index + "] (" + p.name + ")";
	return function() {
		if (typeof(arguments[p.index]) == "undefined" && !p.undefined) throw new TypeError(reference + " must be a string, not undefined.");
		if (arguments[p.index] === null && !p["null"]) throw new TypeError(reference + " must be a string, not null.");
		if (typeof(arguments[p.index]) != "string") throw new TypeError(reference + " must be a string, not " + typeof(arguments[p.index]));
	};
};

var validate = function() {
	var validators = arguments;
	return function() {
		for (var i=0; i<validators.length; i++) {
			validators[i].apply(this,arguments);
		}
	};
}
	
$exports.Type = function(media,subtype,parameters) {
	validate(
		IsString({ index: 0, name: "media" }),
		IsString({ index: 1, name: "subtype" })
	).apply(this,arguments);
	
	this.getMedia = function() {
		return media;
	}
	
	this.getSubtype = function() {
		return subtype;
	}
	
	this.getParameters = function() {
		return parameters;
	}
	
	this.toString = function() {
		var rv = media + "/" + subtype;
		for (var x in parameters) {
			rv += ";" + x + "=" + parameters[x];
		}
		return rv;
	}
};
