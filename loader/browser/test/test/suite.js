window.addEventListener("load", function() {
	var loader = new inonit.loader.Loader(inonit.loader.base);
	var ui = loader.value("api/ui/loader.js")();
	var suite = new ui.api.Suite();
	var api = loader.file("browser/test/api.js", {
		api: {
			browser: ui.unit,
			unit: ui.api,
			apiHtmlScript: loader.file("api/api.html.js")
		}
	});
	var suite = new ui.api.Suite({
		parts: {
			$api: api.getPartDescriptor("../../../../loader/$api.api.html",{},void(0))
		}
	});
	ui.suite(suite);
	debugger;	
});
