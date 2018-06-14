//	Works in Rhino, not Nashorn
var _o = new Packages.java.lang.Object();
jsh.shell.console("apply = " + _o.hashCode.apply);
Packages.java.lang.System.err.println("hash code = " + _o.hashCode.apply(_o,[]));
