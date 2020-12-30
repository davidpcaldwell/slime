package inonit.script.engine;

import java.util.*;

public class Program {
	private ArrayList<DataPropertyDescriptor> variables = new ArrayList<DataPropertyDescriptor>();
	private ArrayList<Code.Loader.Resource> scripts = new ArrayList<Code.Loader.Resource>();

	public void set(DataPropertyDescriptor variable) {
		variables.add( variable );
	}

	public final List<DataPropertyDescriptor> variables() {
		return variables;
	}

	public void add(Code.Loader.Resource script) {
		scripts.add(script);
	}

	public final List<Code.Loader.Resource> scripts() {
		return scripts;
	}

	public static class DataPropertyDescriptor {
		public static DataPropertyDescriptor create(String name, Object value) {
			if (value == null) throw new IllegalArgumentException("value must not be null");
			return new DataPropertyDescriptor(name, value);
		}

		private String name;
		private Object value;
		private boolean configurable;
		private boolean writable;
		private boolean enumerable;

		private DataPropertyDescriptor(String name, Object value) {
			this.name = name;
			this.value = value;
		}

		public String getName() {
			return name;
		}

		public Object value() {
			return value;
		}

		public boolean configurable() {
			return this.configurable;
		}

		public boolean writable() {
			return this.writable;
		}

		public boolean enumerable() {
			return this.enumerable;
		}

		DataPropertyDescriptor configurable(boolean configurable) {
			this.configurable = configurable;
			return this;
		}

		DataPropertyDescriptor writable(boolean writable) {
			this.writable = writable;
			return this;
		}

		DataPropertyDescriptor enumerable(boolean enumerable) {
			this.enumerable = enumerable;
			return this;
		}
	}
}
