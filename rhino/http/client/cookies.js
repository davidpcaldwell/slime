//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.loader.Export<slime.jrunscript.http.client.internal.cookies.Export> } $export
	 */
	function(Packages,$export) {
		/**
		 * @returns { slime.jrunscript.http.client.internal.Cookies }
		 */
		function inonitCookies() {
			var cookies = [];

			var toString = function() {
				return "Cookies: " + JSON.stringify(cookies);
			};

			/** @type { slime.jrunscript.http.client.internal.Cookies["set"] } */
			var set = function(url,headers) {
				var sets = headers.filter( function(header) {
					return header.name.toLowerCase() == "set-cookie";
				});
				sets.forEach( function(header) {
					var trim = function(str) {
						return str.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
					}

					var parts = header.value.split(";");
					var nvp = parts[0];
					var cookie = {};
					cookie.name = nvp.split("=")[0];
					cookie.value = nvp.split("=").slice(1).join("=");
					var jurl = new Packages.java.net.URL(url.toString());
					cookie.domain = String(jurl.getHost());
					cookie.path = String(jurl.getPath());
					parts.slice(1).forEach( function(part) {
						part = trim(part);
						//	See http://tools.ietf.org/html/rfc6265#section-5.2.5 and 5.2.6 for documentation on httponly, secure
						if (part.toLowerCase() == "httponly") {
							cookie.httponly = true;
						} else if (part.toLowerCase() == "secure") {
							cookie.secure = true;
						} else {
							var attribute = part.split("=")[0].toLowerCase();
							attribute = trim(attribute);
							var value = part.split("=")[1];
							value = trim(value);
							if (attribute == "expires") {
								cookie.expires = value;
							} else if (attribute == "max-age") {
								cookie.maxage = value;
							} else if (attribute == "domain") {
								cookie.domain = value;
							} else if (attribute == "path") {
								cookie.path = value;
							}
						}
					});
					//	put cookie at front of list so it automatically supersedes older ones
					cookies.unshift(cookie);
				})
			}

			/** @type { slime.jrunscript.http.client.internal.Cookies["get"] } */
			var get = function(url,headers) {
				//	TODO	obviously this does not work, but passes current unit tests because no cookies are apparently needed for
				//			the Google module, which is the only module that uses the gae implementation currently
				//	TODO	obviously this overincludes cookies
				cookies.forEach( function(cookie) {
					headers.push({ name: "Cookie", value: cookie.name + "=" + cookie.value });
				});
			}

			var rv = {
				set: set,
				get: get
			};

			rv.toString = toString;

			return rv;
		}

		/**
		 * @returns { slime.jrunscript.http.client.internal.Cookies }
		 */
		function javaCookies() {
			var peer = new Packages.java.net.CookieManager();
			peer.setCookiePolicy(Packages.java.net.CookiePolicy.ACCEPT_ALL);

			var toMap = function(headers) {
				var rv = new Packages.java.util.HashMap();
				headers.forEach(function(header) {
					if (!rv.get(header.name)) {
						rv.put(header.name,new Packages.java.util.ArrayList());
					}
					rv.get(header.name).add(header.value);
				});
				return rv;
			}

			var fromMap = function(cookies,headers) {
				var i = cookies.keySet().iterator();
				while(i.hasNext()) {
					var $name = i.next();
					var $values = cookies.get($name);
					var name = String($name);
					var j = $values.iterator();
					while(j.hasNext()) {
						headers.push({ name: name, value: String(j.next()) });
					}
				}
			}

			/** @type { slime.jrunscript.http.client.internal.Cookies } */
			var rv = {
				set: function(url,headers) {
					peer.put(new Packages.java.net.URI(url.toString()),toMap(headers));
				},
				get: function(url,headers) {
					var cookies = peer.get(new Packages.java.net.URI(url.toString()),toMap(headers));
					fromMap(cookies,headers);
				}
			}

			rv.toString = function() {
				return peer.getCookieStore().getCookies().toString();
			}

			return rv;
		}

		$export({
			inonit: inonitCookies,
			java: javaCookies
		})
	}
//@ts-ignore
)(Packages,$export);
