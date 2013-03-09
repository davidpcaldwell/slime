$exports.Type = $api.Function({
	before: [
		$api.Function.arguments.isString({ index: 0, name: "media" }),
		$api.Function.arguments.isString({ index: 1, name: "subtype" })
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
