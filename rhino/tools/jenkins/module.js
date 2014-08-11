$exports.Server = function(o) {
	var client = new jsh.http.Client();
	
	this.request = function(p) {
		return client.request({
			url: o.url + p.url,
			parameters: p.parameters,
			evaluate: function(response) {
				return eval("(" + response.body.stream.character().asString() + ")");
			}
		});
	};
}