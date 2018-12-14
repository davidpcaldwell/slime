window.addEventListener("load", function() {
	var ui = new inonit.loader.Loader(inonit.loader.base).value("api/ui/loader.js")();
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
