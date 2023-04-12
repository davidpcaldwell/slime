//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

function FindProxyForURL(url, host) {
	if (host == "__HOST__") return "PROXY 127.0.0.1:__PORT__";
	return "DIRECT";
}
