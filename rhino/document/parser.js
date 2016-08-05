window.parse = function(string,type) {
	this.result = new XMLSerializer().serializeToString(new DOMParser().parseFromString(string,type));
	return this.result;
};
window.parse(window.data,window.type);

