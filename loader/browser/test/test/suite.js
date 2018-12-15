window.addEventListener("load", function() {
	var loader = new inonit.loader.Loader(inonit.loader.base);
	var ui = loader.value("api/ui/loader.js")();
	var suite = new ui.api.Suite();
	var api = loader.file("browser/test/api.js", {
		api: {
			browser: 
		}
	})
	var suite = new ui.api.Suite({
		parts: {
			scenario: {
				execute: function(scope,verify) {
					verify(1).is(3);
				}
			}
		}
	});
	ui.suite(suite);
	debugger;	
});
