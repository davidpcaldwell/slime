var Excel = function(p) {
	if (!p) throw new Error();
	if (!p.resource) throw new Error();
	if (!p.format) {
		
	}	
};

Object.defineProperty($exports, "Excel", {
	get: function() {
		if ($context.getClass("org.apache.poi.hssf.usermodel.HSSFWorkbook")) {
			return Excel; 
		} else {
			return void(0);
		}
	}
});
