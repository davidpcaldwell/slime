public class Enabled {
	public static void hoHum() throws InterruptedException {
		System.out.println("Ho, hum!");
		for (int i=0; i<100; i++) {
			Thread.sleep(10);
		}
		System.out.println("Ho, hum!");
	}
}
