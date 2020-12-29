namespace slime.jrunscript.runtime.java {
	export interface Classpath {
		getClass(name: string): any
	}

	export interface JavaClass {
	}

	export interface Engine {
		toNativeClass(javaClass: JavaClass): any
		//	TODO	possibly this type could be object; see java.js implementation
		isNativeJavaObject(value: any): boolean
		getJavaClass(name: string): JavaClass
	}

	export interface Context {
		engine: Engine
		classpath: Classpath
	}

	export interface Exports {
		getClass(name: string): any
		isJavaObject(value: any): boolean
		isJavaType(javaclass: JavaClass): (value: any) => boolean
		toNativeClass(javaClass: JavaClass): any
		adapt: {
			String(s: Packages.java.lang.String): string
		}
		test: any
	}
}