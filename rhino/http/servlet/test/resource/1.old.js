//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

map("WEB-INF/generic/", $mapping.getRelativePath("../../java"));
map("WEB-INF/mozilla/", $mapping.getRelativePath("../../rhino"));
map("WEB-INF/test/", $mapping.parent.pathname);

