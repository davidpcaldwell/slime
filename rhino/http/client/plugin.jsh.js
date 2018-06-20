//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/http/client SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return typeof(jsh.js) != "undefined" && typeof(jsh.io) != "undefined" && typeof(jsh.js.web) != "undefined";
	},
	load: function() {
		jsh.http = $loader.module("module.js", {
			api: {
				io: jsh.io,
				js: jsh.js,
				web: jsh.js.web
			}
		});

		jsh.http.test = new function() {
			this.disableHttpsSecurity = function() {
				//	TODO	this HTTPS trust rigamarole should probably be in the shell somewhere, perhaps as a test API
				var _trustManagers = jsh.java.Array.create({
					type: Packages.javax.net.ssl.TrustManager,
					array: [
						new JavaAdapter(
							Packages.javax.net.ssl.X509TrustManager,
							{
								checkServerTrusted: function(){ return null; },
								getAcceptedIssuers: function(){ return null; }
							}
						)
					]
				});
				var _sslContext = Packages.javax.net.ssl.SSLContext.getInstance("SSL");
				_sslContext.init(null, _trustManagers, new Packages.java.security.SecureRandom());
				Packages.javax.net.ssl.HttpsURLConnection.setDefaultSSLSocketFactory(_sslContext.getSocketFactory());

				Packages.javax.net.ssl.HttpsURLConnection.setDefaultHostnameVerifier(
					new JavaAdapter(
						Packages.javax.net.ssl.HostnameVerifier,
						{
							verify: function(hostname,session) {
								return true;
							}
						}
					)
				);
			}
		}
	}
});