var firebase = httpd.loader.value("WEB-INF/db/firebase/slim/server.js", {
	httpd: httpd,
	rest: rest
});

$exports.handle = function(request) {
	var fb = firebase.handle(request);
	if (fb) return fb;
};

$exports.Service = function(references) {
	this.firebase = rest.Service(new firebase.Service(references));
};
