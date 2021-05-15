//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

map("WEB-INF/generic/", new jsh.file.Loader({ directory: $mapping.getRelativePath("../../java").directory }));
map("WEB-INF/mozilla/", new jsh.file.Loader({ directory: $mapping.getRelativePath("../../rhino").directory }));
map("WEB-INF/test/", new jsh.file.Loader({ directory: $mapping.parent }));
