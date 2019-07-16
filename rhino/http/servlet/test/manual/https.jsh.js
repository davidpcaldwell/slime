var file = jsh.shell.HOME.getFile(".inonit/jsh/etc/keystore");
if (file) file.remove();

var tomcat = new jsh.httpd.Tomcat({
	https: true
});
tomcat.map({
	path: "/",
	servlets: {
		"/*": {
			load: function(scope) {
				scope.$exports.handle = function(request) {
					return {
						status: { code: 200 },
						body: {
							type: "application/json",
							string: JSON.stringify({
								path: request.path
							})
						}
					}
				}
			}
		}
	}
});
var chrome = new jsh.shell.browser.chrome.Instance({
	location: jsh.shell.jsh.src.getRelativePath("local/chrome/https")
});
tomcat.start();
chrome.run({
	uris: [
		"https://127.0.0.1:" + tomcat.https.port,
		"http://127.0.0.1:" + tomcat.port
	],
	arguments: [
		"--ignore-certificate-errors"
		//,
//		"--ignore-urlfetcher-cert-requests"
	]
});
tomcat.run();
