//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		$exports.rs = new function() {
			this.getColumns = function(_rs) {
				var metadata = _rs.getMetaData();
				var count = metadata.getColumnCount();
				var columns = [];
				for (var i=0; i<count; i++) {
					columns.push({
						type: {
							code: Number(metadata.getColumnType(i+1)),
							name: String(metadata.getColumnTypeName(i+1)),
							precision: Number(metadata.getPrecision(i+1)),
							scale: Number(metadata.getScale(i+1))
						},
						name: String(metadata.getColumnName(i+1))
					});
				}
				return columns;
			};
		};
	}
)();
