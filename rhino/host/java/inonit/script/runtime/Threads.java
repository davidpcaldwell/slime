package inonit.script.runtime;

import org.mozilla.javascript.*;

public class Threads {
	public static Function synchronizeOn(final Object lock, final Function callable) {
		return new Function() {
			public Object call(Context cntxt, Scriptable s, Scriptable s1, Object[] os) {
				synchronized(lock) {
					return callable.call(cntxt, s, s1, os);
				}
			}
			
			//	TODO	probably not a good idea to stub out all of these methods

			public Scriptable construct(Context cntxt, Scriptable s, Object[] os) {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public String getClassName() {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public Object get(String string, Scriptable s) {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public Object get(int i, Scriptable s) {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public boolean has(String string, Scriptable s) {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public boolean has(int i, Scriptable s) {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public void put(String string, Scriptable s, Object o) {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public void put(int i, Scriptable s, Object o) {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public void delete(String string) {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public void delete(int i) {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public Scriptable getPrototype() {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public void setPrototype(Scriptable s) {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public Scriptable getParentScope() {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public void setParentScope(Scriptable s) {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public Object[] getIds() {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public Object getDefaultValue(Class<?> type) {
				throw new UnsupportedOperationException("Not supported yet.");
			}

			public boolean hasInstance(Scriptable s) {
				throw new UnsupportedOperationException("Not supported yet.");
			}
		};
	}
}
