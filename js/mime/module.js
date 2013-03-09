var IsString = function(p) {
	var reference = (p.name) ? "arguments[" + p.index + "]" : "arguments[" + p.index + "] (" + p.name + ")";
	return function(m) {
		if (typeof(m.arguments[p.index]) == "undefined" && !p.undefined) throw new TypeError(reference + " must be a string, not undefined.");
		if (m.arguments[p.index] === null && !p["null"]) throw new TypeError(reference + " must be a string, not null.");
		if (typeof(m.arguments[p.index]) != "string") throw new TypeError(reference + " must be a string, not " + typeof(m.arguments[p.index]));
	};
};

$exports.Type = $api.Function({
	before: [
		IsString({ index: 0, name: "media" }),
		IsString({ index: 1, name: "subtype" })
	],
	call: function(media,subtype,parameters) {
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
	}
});
