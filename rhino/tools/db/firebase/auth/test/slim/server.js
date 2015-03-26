var client = new httpd.slim.http.Client();

var loadForeignCode = function(url,exports) {
	var code = client.request({
		url: url,
		evaluate: function(response) {
			return response.body.stream.character().asString();
		}
	});
	var lines = [code];
	exports.forEach(function(name) {
		lines.push("$exports." + name + " = window." + name + ";");
		lines.push("delete window." + name + ";");
	});
	return {
		status: {
			code: 200
		},
		body: {
			type: "text/javascript",
			string: lines.join("\n")
		}
	};	
}

$exports.handle = function(request) {
	if (request.path == "slim/db/firebase/vendor/firebase.js") {
		return loadForeignCode("https://cdn.firebase.com/js/client/1.0.15/firebase.js", ["Firebase"]);
	} else if (request.path == "slim/db/firebase/vendor/firebase-simple-login.js") {
		return loadForeignCode("https://cdn.firebase.com/js/simple-login/1.6.0/firebase-simple-login.js", ["FirebaseSimpleLogin"]);
	}
}