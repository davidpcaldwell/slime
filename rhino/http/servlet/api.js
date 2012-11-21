$exports.httpd = {};

$exports.httpd.http = {};

$exports.httpd.http.Response = function() {
};

$exports.httpd.http.Response.text = function(string) {
	return {
		status: {
			code: 200
		},
		headers: [],
		body: {
			type: "text/plain",
			string: string
		}
	};	
}
