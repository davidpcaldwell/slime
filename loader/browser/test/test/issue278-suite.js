var issue278 = false;
for (var i=0; i<parameters.controls.length; i++) {
	if (parameters.controls[i].name == "issue278") {
		issue278 = true;
	}
}
suite.part("fail", {
	execute: function(scope,verify) {
		verify(1).is(2);
	}
});
if (issue278) suite.part("after", {
	parts: {
		suite: {
			parts: {
				scenario: {
					execute: function(scope,verify) {
						verify(1).is(1);
					}
				}
			}
		}
	}
});
