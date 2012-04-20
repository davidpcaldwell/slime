#include <string.h>

#include <jni.h>

#include "shlwapi.h"

JNIEnv* create_vm(char *classpath) {
	JavaVM* jvm;
	JNIEnv* env;
	JavaVMInitArgs args;
	JavaVMOption options[1];

	args.version = JNI_VERSION_1_2;
	args.nOptions = 1;
	char classpathOption[MAX_PATH];
	sprintf(classpathOption, "-Djava.class.path=%s", classpath);
	options[0].optionString = classpathOption;
	args.options = options;
	args.ignoreUnrecognized = JNI_FALSE;

	JNI_CreateJavaVM(&jvm, (void **)&env, &args);
	return env;
}

void invoke_class(JNIEnv* env, int argc, char **argv) {
	jclass helloWorldClass;
	jmethodID mainMethod;
	jobjectArray applicationArgs;
	jstring applicationArg;
	int i;

	helloWorldClass = (*env)->FindClass(env, "inonit/script/jsh/launcher/Main");

	mainMethod = (*env)->GetStaticMethodID(env, helloWorldClass, "main", "([Ljava/lang/String;)V");

	applicationArgs = (*env)->NewObjectArray(env, argc, (*env)->FindClass(env, "java/lang/String"), NULL);

	for (i=1; i<argc; i++) {
		applicationArg = (*env)->NewStringUTF(env, argv[i]);
		(*env)->SetObjectArrayElement(env, applicationArgs, i-1, applicationArg);
	}

	(*env)->CallStaticVoidMethod(env, helloWorldClass, mainMethod, applicationArgs);
}


int main(int argc, char **argv) {
	/*
		TODO	add #ifdef for WIN32 and __unix__
	*/
	/*
		jvm.dll must be in the PATH. For a possible workaround for this limitation, see:
		http://java.sun.com/products/jdk/faq/jni-j2sdk-faq.html question 3
	*/

	/*	Get the parent directory of this launcher. */
	PathRemoveFileSpec(argv[0]);

	/*	Append jsh.jar to the path of the parent directory of this launcher. */
	char jar[MAX_PATH];
	strcpy(jar, argv[0]);
	strcat(jar, "\\jsh.jar");

	JNIEnv* env = create_vm(jar);
	invoke_class(env, argc, argv);
}
