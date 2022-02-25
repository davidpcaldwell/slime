//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

plugin({
	isReady: function() {
		return typeof(jsh.js) != "undefined" && typeof(jsh.io) != "undefined" && typeof(jsh.web) != "undefined" && jsh.java;
	},
	load: function() {
		jsh.http = $loader.module("module.js", {
			api: {
				js: jsh.js,
				java: jsh.java,
				web: jsh.web,
				io: jsh.io
			}
		});

		jsh.http.test = new function() {
			this.disableHttpsSecurity = function() {
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
