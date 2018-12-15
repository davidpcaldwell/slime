window.addEventListener("load", function() {
	var api = inonit.loader.loader.file("../api.js");
	api.suite.part("$api", api.getPartDescriptor("../../../../loader/$api.api.html",{},void(0)));
});
