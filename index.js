const puppeteer = require("puppeteer");

const credentials = {
	username: "lui_gi_3@hotmail.com",
	password: "932101322"
};

const loggedCheck = async (page) => {
	try {
		await page.waitForSelector('#bluebarRoot', { timeout: 10000 });
		return true;
	} catch(err) {
		return false;
	}
};

(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto('https://vapiano.polaris-data.co.uk/login');

	// Login
	await page.type("#login_email", credentials.username);
	await page.type("#login_password", credentials.password);
	await Promise.all([
		page.click('input[type="submit"]'),
		page.waitForNavigation()
	]);

	// Get cookies
	const cookies = await page.cookies();

	// Use cookies in other tab or browser
	const page2 = await browser.newPage();
	await page2.setCookie(...cookies);
	const getHours = await page2.goto('https://vapiano.polaris-data.co.uk/employee/rota/sessions/5934?_dc=1571579204923&page=1&start=0&limit=25');

	const getDays = await page.goto('https://vapiano.polaris-data.co.uk/employee/rota/resource/5934?_dc=1571579204917&page=1&start=0&limit=25');

	try {
		const hours = await getHours.json();
		const days = await getDays.json()
		console.log(hours)
		console.log(days)
	} catch(e) {
		console.error(e);
	} finally {
		await browser.close();
		console.log('Done.');
	}
})();