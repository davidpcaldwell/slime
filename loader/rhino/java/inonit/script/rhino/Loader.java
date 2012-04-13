/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package inonit.script.rhino;

import java.io.*;

import org.mozilla.javascript.*;

public abstract class Loader {
	public abstract String getPlatformCode() throws IOException;
	public abstract String getRhinoCode() throws IOException;

	public static abstract class Classpath {
		public abstract void append(Code code);
	}

	public abstract Classpath getClasspath();

	protected abstract Engine getEngine();

	public final void script(String name, InputStream in, Scriptable scope, Scriptable target) throws IOException {
		getEngine().script(name, in, scope, target);
	}
}
