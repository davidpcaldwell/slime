//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.rhino;

import java.io.*;

import org.mozilla.javascript.*;

public abstract class Loader {
	public abstract String getPlatformCode() throws IOException;
	public abstract String getRhinoCode() throws IOException;

	public static abstract class Classpath {
		public abstract void append(Code.Source code);

		/**
			Should return the class with the given name, or <code>null</code> if there is no such class.
		*/
		public abstract Class getClass(String name);

		public final void append(Code code) {
			append(code.getClasses());
		}
	}

	public abstract Classpath getClasspath();

	protected abstract Engine getEngine();

	public final void script(String name, InputStream in, Scriptable scope, Scriptable target) throws IOException {
		getEngine().script(name, in, scope, target);
	}

	//	TODO	verify whether this class needs to be public in order to be used by script calls
	public static class Bootstrap {
		private Loader loader;

		Bootstrap(Loader loader) {
			this.loader = loader;
		}

		public String getPlatformCode() throws IOException {
			return loader.getPlatformCode();
		}

		public Classpath getClasspath() {
			return loader.getClasspath();
		}

		public void script(String name, InputStream in, Scriptable scope, Scriptable target) throws IOException {
			loader.script(name, in, scope, target);
		}
	}

	public final Scriptable initialize(Engine engine) throws IOException {
		Engine.Program program = new Engine.Program();
		program.set(Engine.Program.Variable.create("$bootstrap", Engine.Program.Variable.Value.create(new Bootstrap(this))));
		program.add(Engine.Source.create("<rhino loader>", this.getRhinoCode()));
		return (Scriptable)engine.execute(program);
	}
}
