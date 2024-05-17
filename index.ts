const puppeteer = require("puppeteer");

const credentials = {
  username: process.env.USER_EMAIL,
  password: process.env.USER_PASSWORD,
  userId: process.env.USER_ID,
};

const getWeek = async (page, element, userId) => {
  await page.setRequestInterception(true);
  page.on("request", (req) =>
    req.resourceType() == "stylesheet" ||
    req.resourceType() == "font" ||
    req.resourceType() === "image"
      ? req.abort()
      : req.continue()
  );
  await page.goto(`${process.env.BASE_URL}/employee/rota/planner/${userId}`);
  await page.waitForSelector(element);
  const table = await page.$$eval(element, (days) =>
    days.map((day) => day.innerHTML).filter((_day, index) => index > 6)
  );
  return table;
};

const generateSchedule = (_week, days, hours) => {
  return days.map((day, index) => ({
    day: day.day,
    day_id: day.day_id,
    workedHours: parseFloat(hours[index].info.match(/\d+.\d+/)[0]),
    perHour: parseFloat(hours[index].info.match(/(£)(\d+.\d+)/)[2]),
    userId: day.emp2job_id,
    startHour: hours[index].StartDate.match(/\d{2}:\d{2}:\d{2}/)[0],
    endHour: hours[index].EndDate.match(/\d{2}:\d{2}:\d{2}/)[0],
  }));
};

const getOffDays = (week) =>
  week
    .map((day, index) => (day.length < 7 ? index : false))
    .filter((day) => day);

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${process.env.BASE_URL}/login`);

  // Login
  await page.type("#login_email", credentials.username);
  await page.type("#login_password", credentials.password);
  await Promise.all([
    page.click('input[type="submit"]'),
    page.waitForNavigation(),
  ]);

  const week = await getWeek(page, ".x-grid-cell-inner", credentials.userId);

  // Get cookies
  const cookies = await page.cookies();
  // Use cookies in other tab or browser
  const page2 = await browser.newPage();
  await page2.setCookie(...cookies);

  const getHours = await page2.goto(
    `${process.env.BASE_URL}/employee/rota/sessions/${credentials.userId}?_dc=1571579204923&page=1&start=0&limit=25`
  );
  const getDays = await page.goto(
    `${process.env.BASE_URL}/employee/rota/resource/${credentials.userId}?_dc=1571579204917&page=1&start=0&limit=25`
  );

  try {
    const hours = await getHours.json();
    const days = await getDays.json();
    console.log(getOffDays(week));
    console.log(generateSchedule(week, days, hours));
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
    console.log("Done.");
  }
})();
