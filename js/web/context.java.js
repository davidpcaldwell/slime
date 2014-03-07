$exports.escaper = {
	encode: function(s) {
		return Packages.java.net.URLEncoder.encode(s);
	},
	decode: function(s) {
		return Packages.java.net.URLDecoder.decode(s);
	}
};
