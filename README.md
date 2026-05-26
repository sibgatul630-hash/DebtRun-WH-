# DebtRun 🏃‍♂️💸
> The Consumer Credit Flight Simulator

DebtRun is a lightweight, interactive web-based financial literacy application designed as a **"flight simulator"** for credit management. Instead of teaching personal finance through dry textbooks or static quizzes, it places users in a realistic, 12-month gamified simulation where they must navigate modern spending decisions, lifestyle temptations, and sudden financial emergencies.

---

## 🎮 What It Does

* **Simulates Real Dilemmas:** Users navigate a 12-month timeline filled with modern financial scenarios, balancing emergency "Needs" (medical bills, car repairs) with tempting "Wants" (sneaker drops, subscription packages).
* **Tracks Modern Payment Methods:** For every scenario, the user chooses how to respond using 4 real-world options: **Cash**, **Credit Card**, **Buy Now, Pay Later (BNPL)**, or **Avoid/Skip Temptation**.
* **Imposes Realistic Penalties:** Carrying credit card debt automatically incurs a monthly compounding interest penalty. If a user's credit utilization crosses a certain threshold, their simulated Credit Score drops instantly.
* **Delivers Live Feedback:** A built-in rule engine acts as an instant **AI Financial Coach**, analyzing the user's financial metrics after every single move to offer sharp, strategic advice.
* **Visualizes the Impact:** A live line graph plots their Cash vs. Debt timeline in real time, showing them exactly how fast compounding interest and micro-loans can destroy a budget.
* **Grades Performance:** At Month 12, the simulation freezes, saves their history in a structured Financial Journal ledger, and awards them a custom **Financial Personality Grade** based on their choices.

---

## 📐 Core Logic & Formulas

To keep the simulation realistic, the engine evaluates financial health using real-world economic principles:

* **Compounding Interest Penalty:** Carrying a credit card balance incurs a $22\%$ annual percentage rate (APR), compounded monthly on outstanding debt:
$$\Delta \text{Debt} = \text{Debt} \times \left( \frac{0.22}{12} \right)$$

* **Credit Utilization Rate:** The system continuously tracks credit usage against a virtual $\$5,000$ limit:
$$\text{Utilization Rate} = \left( \frac{\text{Active Card Debt}}{5000} \right) \times 100\%$$
Crossing the critical $30\%$ threshold immediately triggers a negative impact on the user's simulated Credit Score.

---

## 🛠️ Built With

DebtRun was intentionally built using a lean, high-performance stack to ensure it runs completely client-side without any server lag or deployment overhead:

* **HTML5:** For the core layout, structured dashboard grid, and responsive UI architecture.
* **Tailwind CSS:** Used via CDN for rapid utility styling, fluid spacing, and designing the modern, premium dark-mode theme.
* **Vanilla JavaScript (ES6+):** Manages the entire 12-month game state loop, handles the dynamic financial calculation logic, tracks the overlapping BNPL payment arrays, and powers the simulated rule-based AI Coach.
* **Chart.js:** Utilized via CDN to render and dynamically update the live line graph tracking the user's Cash vs. Debt timeline in real time.
* **Font Awesome:** For clean, crisp financial and gameplay dashboard icons.

---

## 🚧 Challenges We Ran Into

* **Balancing the Game Stakes:** Initially, when we introduced the "Avoid" button, players could simply skip every single event to finish the game with perfect metrics. We resolved this by splitting the scenarios into two strict categories: **Wants** and **Needs**. Skipping a "Want" rewards the user's impulse control, while trying to skip an emergency "Need" (like a medical bill) triggers an even harsher delayed financial penalty.
* **Simulating BNPL Debt Accumulation:** Unlike traditional credit cards, "Buy Now, Pay Later" installment plans don't charge immediate interest but quietly lock up future income. We solved this by creating a dedicated installment tracking array in JavaScript that automatically deducts 25% of the remaining balances from the user’s cash pool at the start of each subsequent month.
* **Preventing Dashboard Latency:** Because the application updates a live chart, an AI feedback feed, a data table, and five distinct financial metrics all on a single button click, we centralized all state changes into a single global update function that forces a clean, simultaneous re-render of the DOM components and Chart.js instances instantly.

---

## 🏆 Accomplishments that we're proud of

* **Building a True "Zero-Lag" Dashboard:** By writing optimized, vanilla JavaScript to handle the math and state updates entirely on the client side, every single button click instantly syncs the charts, data ledger, AI feed, and financial metrics with zero loading delay.
* **Frictionless, No-Setup Deployment:** Anyone can download our three core files (`index.html`, `style.css`, `app.js`), open it in any web browser, and play the game completely offline with zero installation or database friction.
* **An Engaging, High-Fidelity Theme:** Designed a cohesive dark-mode UI from scratch using a professional slate and zinc color palette with neon emerald accents for cash assets and neon amber accents for liabilities.

---

## 🧠 What We Learned

* **The Power of Interactive Learning:** Watching a debt graph spike in real time after a single bad choice teaches a student more about compounding interest than reading a ten-page textbook chapter ever could.
* **Efficient Client-Side State Management:** This project forced us to master synchronous data flow in pure JavaScript, managing multiple shifting variables—like tracking independent, overlapping BNPL payments alongside credit card utilization ratios—without relying on a bulky backend framework.

---

## 🚀 What's Next for DebtRun

* **Real-World Banking & API Integration:** Integrating safe, read-only open banking APIs to allow students to securely sync their real-world accounts to run parallel "shadow simulations" based on their actual spending habits.
* **Expanded Dynamic Scenario Engine:** Scaling the loop into a multi-year career and lifestyle simulation introducing variables like student loan amortization schedules, variable-rate housing mortgages, and retirement investment portfolios ($401k/\text{Roth IRA}$).
* **Multiplayer Classroom Mode:** Building a teacher/instructor dashboard utilizing WebSockets to host live, synchronized group simulations where a whole classroom can compete in real time.

---

## 📝 How to Run Locally

1. Clone or download this repository to your local machine.
2. Ensure you have the three core files in the same directory:
   * `index.html`
   * `style.css`
   * `app.js`
3. Simply double-click `index.html` or right-click and choose **Open with Web Browser**. No installation, servers, or terminal commands required!

---
*Disclaimer: DebtRun is an educational simulation tool. It does not provide real-world financial, legal, or investment advice.*
