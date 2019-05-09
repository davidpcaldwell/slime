try {
    var v = value;
} catch(e) {
}
if (!v) {
    setValue(null);
} else {
    setValue(v);
}