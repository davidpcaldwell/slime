//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

print("Hello, authorize.js");
var String = Java.type("java.lang.String");
var Class = Java.type("java.lang.Class");
var Boolean = Java.type("java.lang.Boolean");
var PasswordAuthentication = Java.type("java.net.PasswordAuthentication");
var BasicAuthenticationClass = Class.forName("sun.net.www.protocol.http.BasicAuthentication");
var AuthenticationInfo = Java.type("sun.net.www.protocol.http.AuthenticationInfo");
var BasicAuthorizationInfo = Java.extend(AuthenticationInfo, {
	supportsPreemptiveAuthorization: function() { return true; },
	getHeaderValue: function() { return "foo"; },
	setHeaders: function() {},
	isAuthorizationStale: function(header) { return false; }
});
var URL = Java.type("java.net.URL");
var Array = Java.type("java.lang.reflect.Array");
var AuthScheme = Java.type("sun.net.www.protocol.http.AuthScheme");
if (false) {
	var signature = Array.newInstance(Class.forName("java.lang.Class"), 4);
	signature[0] = Boolean.TYPE;
	signature[1] = Class.forName("java.net.URL");
	signature[2] = Class.forName("java.lang.String");
	signature[3] = Class.forName("java.net.PasswordAuthentication");
	var args = Array.newInstance(Class.forName("java.lang.Object"), 4);
	args[0] = false;
	args[1] = new URL("http://raw.githubusercontent.com");
	args[2] = null;
	args[3] = new PasswordAuthentication("USER!", new String("PASSWORD!!").toCharArray());
	var ctor = BasicAuthenticationClass.getDeclaredConstructor(
		signature
	);
	print(ctor);
	var githubAuthorization = ctor.newInstance(args);
	print(githubAuthorization);
} else {
	var header = new BasicAuthorizationInfo(
		AuthenticationInfo.SERVER_AUTHENTICATION,
		AuthScheme.BASIC,
		"raw.githubusercontent.com",
		49905,
		null
	);
	var method = Class.forName("sun.net.www.protocol.http.AuthenticationInfo").getDeclaredMethod("addToCache");
	print(method);
	method.setAccessible(true);
	method.invoke(header);
	print("added to cache");
	if (false) {
		header.addToCache();
		print(header);
	}
}
if (false) githubAuthorization.addToCache();
print("Goodbye, authorize.js");
