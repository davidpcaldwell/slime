//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the js/debug SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.cpu = function(spi) {
	return new function() {
		this.profiles = new function() {
			var currentThread = function() {
				return Packages.java.lang.Thread.currentThread();
			}

			var getThreadId = function() {
				return Packages.java.lang.System.identityHashCode(currentThread());
			}

			var byThread = {};

			this.current = function() {
				if (!byThread[getThreadId()]) {
					byThread[getThreadId()] = { id: String(currentThread().getName()), profile: new spi.Profile() };
				}
				return byThread[getThreadId()].profile;
			}

			this.all = function() {
				var rv = [];
				for (var x in byThread) {
					rv.push(byThread[x]);
				}
				return rv;
			}
		}
	}
};
