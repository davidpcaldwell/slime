var base = jsh.script.file.parent.parent;
var URL = "http://github.com/davidpcaldwell/slime";
if (jsh.shell.browser.chrome) {
	var instance = new jsh.shell.browser.chrome.Instance({
		location: base.getRelativePath("local/chrome/hosting")
	});
	instance.run({
		uri: URL
	});
} else {
	//	Otherwise, fall back to Java desktop integration and default browser
	Packages.java.awt.Desktop.getDesktop().browse( new Packages.java.net.URI( URL ) );
}
