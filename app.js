/**
 * DebtRun — 12-month consumer credit flight simulator
 */

const CREDIT_LIMIT = 5000;
const ANNUAL_APR = 0.22;
const MONTHLY_RATE = ANNUAL_APR / 12;

// ─── Game state ─────────────────────────────────────────────────────────────
let month = 1;
let cash = 1000;
let debt = 0;
let creditScore = 700;
let totalInterestPaid = 0;
let bnplOwed = 0;
let history = [];

let chart = null;
let chartLabels = ["Start"];
let chartCash = [1000];
let chartDebt = [0];

let currentScenario = null;
let choiceLocked = false;
let gameOver = false;

// ─── 12 monthly scenarios ───────────────────────────────────────────────────
const SCENARIOS = [
  {
    month: 1,
    type: "emergency",
    title: "Urgent Care Visit",
    description:
      "You twisted your ankle and need an urgent-care copay before they’ll see you. Skipping care isn’t really an option if you want to heal properly.",
    cost: 150,
  },
  {
    month: 2,
    type: "want",
    title: "Limited Sneaker Drop",
    description:
      "Your favorite brand just dropped a collab pair. They’re selling out in minutes and your friends are already posting checkout screenshots.",
    cost: 120,
  },
  {
    month: 3,
    type: "emergency",
    title: "Car Repair — Brakes",
    description:
      "Your mechanic says the brake pads are metal-on-metal. You need the car to get to work and class this week.",
    cost: 280,
  },
  {
    month: 4,
    type: "want",
    title: "Concert Tickets",
    description:
      "An artist you’ve streamed all year announced a one-night show in your city. GA tickets are still available—for now.",
    cost: 85,
  },
  {
    month: 5,
    type: "want",
    title: "Subscription Stack",
    description:
      "Streaming, cloud storage, and a gym app all renewed the same week. You could trim some, but canceling feels annoying right now.",
    cost: 45,
  },
  {
    month: 6,
    type: "emergency",
    title: "Laptop Crash",
    description:
      "Your laptop won’t boot before a major project deadline. A repair shop quoted parts and labor to get you running again.",
    cost: 400,
  },
  {
    month: 7,
    type: "want",
    title: "Gaming Setup Upgrade",
    description:
      "A new monitor and controller bundle is on sale. It’s not essential, but it would make your downtime a lot more fun.",
    cost: 200,
  },
  {
    month: 8,
    type: "emergency",
    title: "Dental Procedure",
    description:
      "A toothache turned into a cavity that needs a filling today. The dentist can fit you in if you pay at checkout.",
    cost: 175,
  },
  {
    month: 9,
    type: "want",
    title: "Weekend Getaway",
    description:
      "Friends invited you on a budget road trip. Your share covers gas, a hostel, and food for two days.",
    cost: 250,
  },
  {
    month: 10,
    type: "emergency",
    title: "Phone Replacement",
    description:
      "Your phone screen shattered and the touch layer failed. You need a replacement to use mobile banking and ride apps.",
    cost: 350,
  },
  {
    month: 11,
    type: "want",
    title: "Holiday Gift Splurge",
    description:
      "You promised thoughtful gifts for family this year. A shopping cart full of items is waiting at checkout.",
    cost: 180,
  },
  {
    month: 12,
    type: "emergency",
    title: "Security Deposit Top-Up",
    description:
      "Your landlord requires an extra deposit after a lease renewal. It’s due this month to keep your housing secure.",
    cost: 300,
  },
];

// ─── DOM refs ───────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const els = {
  cash: $("metric-cash"),
  debt: $("metric-debt"),
  score: $("metric-score"),
  util: $("metric-util"),
  interest: $("metric-interest"),
  bnplBanner: $("bnpl-banner"),
  bnpl: $("metric-bnpl"),
  monthBadge: $("month-badge"),
  scenarioType: $("scenario-type"),
  scenarioTitle: $("scenario-title"),
  scenarioDescription: $("scenario-description"),
  scenarioCost: $("scenario-cost"),
  choiceFeedback: $("choice-feedback"),
  aiCoach: $("ai-coach"),
  journalBody: $("journal-body"),
  finalSummary: $("final-summary"),
  summaryContent: $("summary-content"),
  personalityGrade: $("personality-grade"),
  interactionPanel: $("interaction-panel"),
  buttons: document.querySelectorAll(".choice-btn"),
};

// ─── Formatting ─────────────────────────────────────────────────────────────
function formatMoney(n) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatMoneyDecimal(n) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function utilizationPercent() {
  return Math.min(100, (debt / CREDIT_LIMIT) * 100);
}

function getScenarioForMonth(m) {
  return SCENARIOS.find((s) => s.month === m) || SCENARIOS[SCENARIOS.length - 1];
}

// ─── UI updates ─────────────────────────────────────────────────────────────
function pulseMetric(el) {
  const card = el.closest(".metric-card");
  if (card) {
    card.classList.add("metric-pulse");
    setTimeout(() => card.classList.remove("metric-pulse"), 500);
  }
}

function renderMetrics() {
  els.cash.textContent = formatMoney(cash);
  els.debt.textContent = formatMoney(debt);
  els.score.textContent = String(Math.round(creditScore));
  els.util.textContent = `${utilizationPercent().toFixed(1)}%`;
  els.interest.textContent = formatMoneyDecimal(totalInterestPaid);

  if (bnplOwed > 0) {
    els.bnplBanner.classList.remove("hidden");
    els.bnpl.textContent = formatMoneyDecimal(bnplOwed);
  } else {
    els.bnplBanner.classList.add("hidden");
  }
}

function renderScenario() {
  currentScenario = getScenarioForMonth(month);
  els.monthBadge.textContent = gameOver ? "Simulation Complete" : `Month ${month} of 12`;
  els.scenarioTitle.textContent = currentScenario.title;
  els.scenarioDescription.textContent = currentScenario.description;
  els.scenarioCost.textContent = formatMoney(currentScenario.cost);

  els.scenarioType.textContent =
    currentScenario.type === "emergency" ? "Emergency" : "Want / Temptation";
  els.scenarioType.className =
    "scenario-type " +
    (currentScenario.type === "emergency" ? "scenario-emergency" : "scenario-want");

  const avoidBtn = document.getElementById("btn-avoid");
  if (currentScenario.type === "want") {
    avoidBtn.textContent = "Avoid / Skip Temptation";
  } else {
    avoidBtn.textContent = "Avoid / Skip (Risky for Emergencies)";
  }
}

function renderJournal() {
  if (history.length === 0) {
    els.journalBody.innerHTML = `
      <tr class="journal-empty">
        <td colspan="7" class="text-slate-500 text-center py-6">No decisions logged yet. Make your first choice above.</td>
      </tr>`;
    return;
  }

  els.journalBody.innerHTML = history
    .map((row) => {
      const cashClass = row.cashDelta >= 0 ? "delta-positive" : "delta-negative";
      const debtClass = row.debtDelta <= 0 ? "delta-positive" : "delta-negative";
      return `
        <tr>
          <td>${row.month}</td>
          <td>${row.scenario}</td>
          <td>${row.choice}</td>
          <td class="${cashClass}">${row.cashDelta >= 0 ? "+" : ""}${formatMoney(row.cashDelta)}</td>
          <td class="${debtClass}">${row.debtDelta >= 0 ? "+" : ""}${formatMoney(row.debtDelta)}</td>
          <td>${row.score}</td>
          <td>${row.util.toFixed(1)}%</td>
        </tr>`;
    })
    .join("");
}

function setCoachMessage(text, tone = "default") {
  const cls =
    tone === "warning" ? "coach-message warning" : tone === "danger" ? "coach-message danger" : "coach-message";
  els.aiCoach.innerHTML = `<p class="${cls}">${text}</p>`;
}

function setFeedback(text, tone = "") {
  els.choiceFeedback.textContent = text;
  els.choiceFeedback.className = `mt-4 text-sm min-h-[1.25rem] feedback-${tone}`;
}

function updateChartPoint() {
  const label = gameOver ? "End" : `M${month}`;
  const lastLabel = chartLabels[chartLabels.length - 1];
  const lastCash = chartCash[chartCash.length - 1];
  const lastDebt = chartDebt[chartDebt.length - 1];

  if (lastLabel === label && lastCash === cash && lastDebt === debt) return;

  if (lastLabel === label) {
    chartCash[chartCash.length - 1] = cash;
    chartDebt[chartDebt.length - 1] = debt;
  } else {
    chartLabels.push(label);
    chartCash.push(cash);
    chartDebt.push(debt);
  }

  chart.data.labels = chartLabels;
  chart.data.datasets[0].data = chartCash;
  chart.data.datasets[1].data = chartDebt;
  chart.update("none");
}

function lockChoices(lock) {
  choiceLocked = lock;
  els.buttons.forEach((btn) => {
    btn.disabled = lock || gameOver;
  });
}

// ─── Credit score logic ─────────────────────────────────────────────────────
function recalculateCreditScore(endOfMonth = false) {
  const util = utilizationPercent();
  let delta = 0;

  if (util > 30) {
    delta -= Math.round(8 + (util - 30) * 0.4);
  } else if (util <= 10 && debt === 0) {
    delta += 5;
  } else if (util <= 20) {
    delta += 2;
  }

  if (endOfMonth && debt > 0 && util > 50) {
    delta -= 5;
  }

  if (endOfMonth && debt === 0 && bnplOwed === 0) {
    delta += 3;
  }

  if (totalInterestPaid > 50) {
    delta -= 2;
  }

  creditScore = Math.max(300, Math.min(850, creditScore + delta));
}

// ─── End of month processing ────────────────────────────────────────────────
function applyEndOfMonthProcess() {
  const notes = [];

  // BNPL: charge one equal installment of outstanding BNPL (spread over up to 3 months)
  if (bnplOwed > 0) {
    const installment = Math.ceil((bnplOwed / 3) * 100) / 100;
    const payment = Math.min(bnplOwed, installment);
    if (cash >= payment) {
      cash -= payment;
      bnplOwed = Math.round((bnplOwed - payment) * 100) / 100;
      notes.push(`BNPL installment: ${formatMoneyDecimal(payment)}`);
    } else {
      const shortfall = payment - cash;
      cash = 0;
      bnplOwed = Math.round((bnplOwed - payment) * 100) / 100;
      debt += shortfall;
      creditScore = Math.max(300, creditScore - 12);
      notes.push(`Missed BNPL payment — ${formatMoneyDecimal(shortfall)} moved to card debt`);
    }
  }

  // Credit card interest
  if (debt > 0) {
    const interest = Math.round(debt * MONTHLY_RATE * 100) / 100;
    debt = Math.round((debt + interest) * 100) / 100;
    totalInterestPaid = Math.round((totalInterestPaid + interest) * 100) / 100;
    notes.push(`Card interest (22% APR): ${formatMoneyDecimal(interest)}`);
  }

  recalculateCreditScore(true);

  return notes;
}

// ─── AI Coach ─────────────────────────────────────────────────────────────────
function updateAICoach(choiceType, context = {}) {
  const util = utilizationPercent();
  const s = currentScenario;
  let msg = "";

  if (gameOver) {
    msg = buildFinalCoachSummary();
    setCoachMessage(msg);
    return;
  }

  switch (choiceType) {
    case "cash":
      if (context.insufficient) {
        msg = `You didn't have enough cash for ${formatMoney(s.cost)}, so you had to cover the gap another way—that's how thin buffers turn into debt spirals. Build a small emergency fund before lifestyle spending catches up.`;
        setCoachMessage(msg, "danger");
        return;
      }
      msg =
        util > 30
          ? `Paying cash was disciplined, but your utilization is still ${util.toFixed(1)}% from earlier months—past choices linger on your report. Keep paying down the card to unlock score recovery.`
          : `Strong move: cash avoids interest and keeps utilization at ${util.toFixed(1)}%. You're treating credit as a tool, not a second paycheck.`;
      break;

    case "credit":
      msg =
        util > 30
          ? `Swiping added debt and pushed utilization to ${util.toFixed(1)}%—above the 30% threshold lenders watch closely. Expect your score to feel pressure until balances drop.`
          : `Credit kept liquidity this month, and utilization at ${util.toFixed(1)}% is still manageable. Have a payoff plan before interest silently compounds.`;
      break;

    case "bnpl":
      msg =
        bnplOwed > 0
          ? `BNPL split the pain: 25% left your wallet now and ${formatMoneyDecimal(bnplOwed)} is still owed in installments. Micro-loans stack fast—track every commitment like a real bill.`
          : `You cleared BNPL this cycle—nice. Remember: four "small" BNPL plans can equal one maxed-out card payment.`;
      break;

    case "avoid":
      if (s.type === "want") {
        msg = `You resisted a want and kept ${formatMoney(s.cost)} in your pocket. Delayed gratification is one of the highest-ROI habits in personal finance.`;
      } else {
        msg = `Ignoring an emergency often costs more later—you paid a ${formatMoney(context.penalty || 0)} penalty when the problem escalated. Real emergencies need a plan, not avoidance.`;
        setCoachMessage(msg, "warning");
        return;
      }
      break;

    default:
      msg = `Month ${month}: weigh needs vs. wants before you tap pay. Your score (${Math.round(creditScore)}) and cash (${formatMoney(cash)}) are the runway for every decision.`;
  }

  if (totalInterestPaid > 100) {
    msg += ` You've already paid ${formatMoneyDecimal(totalInterestPaid)} in interest—money that never bought you a single thing.`;
  }

  const tone = util > 50 || context.insufficient ? "warning" : "default";
  setCoachMessage(msg, tone);
}

function buildFinalCoachSummary() {
  const util = utilizationPercent();
  if (cash >= 800 && debt < 200 && creditScore >= 720) {
    return "You finished with solid cash, low debt, and a healthy score. You treated credit as a safety net—not a lifestyle fund.";
  }
  if (debt > 1500 || util > 60) {
    return "High balances and interest drag defined your year. The good news: this was a simulator—now you can rewrite the script with a payoff plan and stricter wants filter.";
  }
  return "You navigated a mixed year—some smart calls, some costly ones. Review your journal: patterns matter more than any single month.";
}

// ─── Choice handling ──────────────────────────────────────────────────────────
function makeChoice(type) {
  if (choiceLocked || gameOver || !currentScenario) return;

  lockChoices(true);
  const s = currentScenario;
  const cost = s.cost;
  let cashBefore = cash;
  let debtBefore = debt;
  let choiceLabel = "";
  let feedback = "";
  let feedbackTone = "success";
  let penalty = 0;

  switch (type) {
    case "cash": {
      choiceLabel = "Paid with Cash";
      if (cash >= cost) {
        cash -= cost;
        feedback = `Paid ${formatMoney(cost)} in cash.`;
      } else {
        const gap = cost - cash;
        cash = 0;
        debt += gap;
        feedback = `Only ${formatMoney(cashBefore)} available — ${formatMoney(gap)} went on the card.`;
        feedbackTone = "warning";
        updateAICoach("cash", { insufficient: true });
        logTurn(choiceLabel + " (partial)", cashBefore, debtBefore);
        finishTurn(feedback, feedbackTone);
        return;
      }
      break;
    }

    case "credit": {
      choiceLabel = "Credit Card";
      debt += cost;
      feedback = `Charged ${formatMoney(cost)} to your card. Utilization is now ${utilizationPercent().toFixed(1)}%.`;
      if (utilizationPercent() > 30) feedbackTone = "warning";
      break;
    }

    case "bnpl": {
      choiceLabel = "BNPL";
      const upfront = Math.round(cost * 0.25 * 100) / 100;
      const financed = Math.round(cost * 0.75 * 100) / 100;

      if (cash >= upfront) {
        cash -= upfront;
        bnplOwed = Math.round((bnplOwed + financed) * 100) / 100;
        feedback = `Paid ${formatMoneyDecimal(upfront)} now; ${formatMoneyDecimal(financed)} added to BNPL balance.`;
      } else {
        const fromCash = cash;
        const stillNeed = upfront - fromCash;
        cash = 0;
        debt += stillNeed;
        bnplOwed = Math.round((bnplOwed + financed) * 100) / 100;
        feedback = `BNPL upfront shortfall—${formatMoneyDecimal(stillNeed)} hit the card.`;
        feedbackTone = "warning";
      }
      break;
    }

    case "avoid": {
      if (s.type === "want") {
        choiceLabel = "Avoided Temptation";
        feedback = `Skipped "${s.title}" and saved ${formatMoney(cost)}.`;
        creditScore = Math.min(850, creditScore + 4);
      } else {
        choiceLabel = "Ignored Emergency";
        penalty = Math.round(cost * 0.5 * 100) / 100;
        debt += penalty;
        feedback = `Ignoring the problem made it worse—a ${formatMoneyDecimal(penalty)} late penalty was added to debt.`;
        feedbackTone = "error";
        creditScore = Math.max(300, creditScore - 15);
      }
      break;
    }

    default:
      lockChoices(false);
      return;
  }

  recalculateCreditScore();
  updateAICoach(type, { penalty });
  logTurn(choiceLabel, cashBefore, debtBefore);
  finishTurn(feedback, feedbackTone);
}

function logTurn(choiceLabel, cashBefore, debtBefore) {
  history.push({
    month,
    scenario: currentScenario.title,
    choice: choiceLabel,
    cashDelta: cash - cashBefore,
    debtDelta: debt - debtBefore,
    score: Math.round(creditScore),
    util: utilizationPercent(),
  });
  renderJournal();
}

function finishTurn(feedback, tone) {
  setFeedback(feedback, tone);
  renderMetrics();
  updateChartPoint();

  setTimeout(() => {
    advanceMonth();
  }, 900);
}

// ─── Month progression ────────────────────────────────────────────────────────
function advanceMonth() {
  const eomNotes = applyEndOfMonthProcess();
  renderMetrics();
  updateChartPoint();

  if (eomNotes.length > 0 && !gameOver) {
    const extra = eomNotes.join(" · ");
    const prev = els.choiceFeedback.textContent;
    setFeedback(prev ? `${prev} | ${extra}` : extra, "warning");
  }

  if (month >= 12) {
    endGame();
    return;
  }

  month += 1;
  renderScenario();
  lockChoices(false);
  setFeedback("", "");
}

function endGame() {
  gameOver = true;
  document.body.classList.add("game-frozen");
  lockChoices(true);

  renderScenario();
  renderMetrics();
  updateChartPoint();
  updateAICoach("default");

  const grade = computePersonalityGrade();
  els.finalSummary.classList.remove("hidden");
  els.summaryContent.innerHTML = `
    <ul>
      <li><strong>Final cash:</strong> ${formatMoney(cash)}</li>
      <li><strong>Final card debt:</strong> ${formatMoney(debt)}</li>
      <li><strong>BNPL remaining:</strong> ${formatMoneyDecimal(bnplOwed)}</li>
      <li><strong>Total interest paid:</strong> ${formatMoneyDecimal(totalInterestPaid)}</li>
      <li><strong>Final credit score:</strong> ${Math.round(creditScore)} (range 300–850)</li>
      <li><strong>Credit utilization:</strong> ${utilizationPercent().toFixed(1)}%</li>
      <li><strong>Months played:</strong> 12</li>
    </ul>
    <p class="mt-4 text-slate-400 text-sm">${grade.blurb}</p>
  `;
  els.personalityGrade.textContent = `Financial Personality: ${grade.title}`;
}

function computePersonalityGrade() {
  const score = creditScore;
  const c = cash;
  const d = debt;

  if (c >= 900 && d <= 100 && score >= 750) {
    return {
      title: "A — Strategic Steward",
      blurb: "You protected cash, minimized debt, and kept your score strong. You understand opportunity cost and credit hygiene.",
    };
  }
  if (c >= 600 && d < 800 && score >= 680) {
    return {
      title: "B — Balanced Spender",
      blurb: "You made tradeoffs without spiraling. Tighten wants spending and pay cards faster to level up.",
    };
  }
  if (d > 2000 || score < 620 || totalInterestPaid > 200) {
    return {
      title: "D — Debt Drifter",
      blurb: "Interest and balances dominated your year. Focus on a debt snowball and a 30% utilization ceiling.",
    };
  }
  if (c < 300 && d > 1000) {
    return {
      title: "F — Crash Landing",
      blurb: "Cash depleted while debt stacked. Rebuild with a bare-bones budget and zero new BNPL until stable.",
    };
  }
  return {
    title: "C — Learning Pilot",
    blurb: "Mixed results—some wins, some costly shortcuts. Replay and try paying emergencies with cash while skipping wants.",
  };
}

// ─── Chart init ───────────────────────────────────────────────────────────────
function initChart() {
  const ctx = $("finance-chart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartLabels,
      datasets: [
        {
          label: "Cash",
          data: chartCash,
          borderColor: "#34d399",
          backgroundColor: "rgba(52, 211, 153, 0.1)",
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Card Debt",
          data: chartDebt,
          borderColor: "#fbbf24",
          backgroundColor: "rgba(251, 191, 36, 0.08)",
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              return `${ctx.dataset.label}: ${formatMoney(ctx.parsed.y)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(148, 163, 184, 0.08)" },
          ticks: { color: "#94a3b8", font: { size: 11 } },
        },
        y: {
          grid: { color: "rgba(148, 163, 184, 0.08)" },
          ticks: {
            color: "#94a3b8",
            callback: (v) => "$" + v,
          },
        },
      },
    },
  });
}

// ─── Init & events ────────────────────────────────────────────────────────────
function init() {
  initChart();
  renderMetrics();
  renderScenario();
  renderJournal();
  setCoachMessage(
    "Welcome to DebtRun. Each month you'll face a real-world spending scenario. Your choices shape cash, debt, and your credit score over 12 months. Think before you swipe."
  );

  els.buttons.forEach((btn) => {
    btn.addEventListener("click", () => makeChoice(btn.dataset.choice));
  });
}

document.addEventListener("DOMContentLoaded", init);
