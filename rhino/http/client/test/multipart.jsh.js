//  Only runs under Nashorn

var array = [];
for (var i=0; i<256; i++) {
    array.push(i);
}
var _array = jsh.java.Array.create({
    type: Packages.java.lang.Byte.TYPE, array: array
});
for (var i=0; i<_array.length; i++) {
    jsh.shell.console("java byte " + i + " is " + _array[i]);
}
var _input = new Packages.java.io.ByteArrayInputStream(_array);

var parts = [
    {
        name: "bytes",
        filename: "filename",
        type: "application/octet-stream",
        stream: jsh.io.java.adapt(_input)
    }
];

var multipart = new jsh.io.mime.Multipart({
    subtype: "form-data",
    parts: parts
});

jsh.shell.jsh.src.getRelativePath("local/test/rhino/http/client/multipart").write(
    multipart.read.binary(),
    { append: false, recursive: true }
);

jsh.shell.console("multipart = " + multipart);

var echo = new jsh.http.Client().request({
    url: "https://postman-echo.com/post",
    body: multipart,
    evaluate: function(response) {
        return JSON.parse(response.body.stream.character().asString());
    }
});

jsh.shell.jsh.src.getRelativePath("local/test/rhino/http/client/multipart.json").write(JSON.stringify(echo), { append: false, recursive: true });
var file = echo.files.filename;
file = file.substring(file.indexOf(",")+1);
var _decoder = Packages.java.util.Base64.getDecoder();
jsh.shell.console("file = " + file);
var _bytes = _decoder.decode(file);
for (var i=0; i<_bytes.length; i++) {
    jsh.shell.console("byte " + i + " is " + _bytes[i]);
}