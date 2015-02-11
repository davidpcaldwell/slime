window.addEventListener("click", function(e) {
	console.log("clicked something; location = " + document.location.href);
	if (e.target.tagName.toLowerCase() == "a" && (true || e.target.getAttribute("webview")) ) {
		console.log("Clicked link: " + e.target.href);
		window.jsh.message.navigate(e.target.href);
	}
});

window.addEventListener("keydown", function(e) {
	if (e.keyIdentifier == "U+0052" && e.metaKey) {
		window.location.reload();
	}
	if (e.keyIdentifier == "Left" && e.metaKey) {
		window.history.back();
	}
	if (e.keyIdentifier == "Right" && e.metaKey) {
		window.history.forward();
	}
	if (false) {
		console.log("Platform: " + navigator.platform);
		for (var x in e) {
			console.log("keydown " + x + ": " + e[x]);
		}
	}
});
