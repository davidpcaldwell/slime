//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

window.parse = function(string,type) {
	this.result = new XMLSerializer().serializeToString(new DOMParser().parseFromString(string,type));
	return this.result;
};
window.parse(window.data,window.type);
