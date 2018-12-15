window.addEventListener("load", function() {
	var loader = new inonit.loader.Loader(inonit.loader.base);
	var api = loader.file("browser/test/api.js", {
		api: {
			ui: loader.value("api/ui/loader.js")(),
			apiHtmlScript: loader.file("api/api.html.js")
		}
	});
	var suite = new api.Suite();
	suite.part("$api", api.getPartDescriptor("../../../../loader/$api.api.html",{},void(0)));
	api.suite(suite);
});
