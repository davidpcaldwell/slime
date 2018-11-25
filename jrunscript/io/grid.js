var excel;

var Excel = function() {
	var Workbook = function(_workbook) {
	}
	
	var format = {};
	
	format.xls = function(p) {
		var _workbook = new Packages.org.apache.poi.hssf.usermodel.HSSFWorkbook(
			p.resource.read($context.Streams.binary).java.adapt()
		);
		return new Workbook(_workbook);
	}
	
	format.xlsx = function(p) {
		var _workbook = new Packages.org.apache.poi.xssf.usermodel.XSSFWorkbook(p.resource.read($context.Streams.binary).java.adapt());
		return new Workbook(_workbook);
	};
	
	this.format = format;

	this.Workbook = function(p) {
		if (!p.format) {
			if (/\.xls$/.test(p.resource.name)) {
				p.format = format.xls;
			} else if (/\.xlsx$/.test(p.resource.name)) {
				p.format = format.xlsx;
			}
		}
		return new Workbook(p.format(p));
	}
};

Object.defineProperty($exports, "excel", {
	get: function() {
		if (!excel && $context.getClass("org.apache.poi.hssf.usermodel.HSSFWorkbook")) {
			excel = new Excel();
		}
		return excel;
	}
});
