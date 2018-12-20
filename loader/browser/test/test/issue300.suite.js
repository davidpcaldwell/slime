var failure = false;
for (var i=0; i<parameters.controls.length; i++) {
	if (parameters.controls[i].name == "failure") {
		failure = true;
	}
}
suite.part("try", {
	execute: function(scope,verify) {
		verify(failure).is(false);
	}
});
