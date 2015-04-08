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
