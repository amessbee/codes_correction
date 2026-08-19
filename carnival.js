(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  let tickets = 10;
  const ticketBank = $('#ticketBank');
  function renderTickets() {
    ticketBank.innerHTML = Array.from({ length: tickets }, (_, i) => `<span class="ticket" style="--tilt:${i % 2 ? 2 : -2}deg">TICKET</span>`).join('');
    $('#ticketStatus').textContent = tickets ? `FORTUNE: ${tickets}` : 'OFFICIALLY BANKRUPT';
  }

  let swindle = { plays: 0, wins: 0, house: 0, locked: false };
  function renderSwindle() {
    $('#swindlePlays').textContent = swindle.plays;
    $('#swindleWins').textContent = swindle.wins;
    $('#houseProfit').textContent = swindle.house > 0 ? `+${swindle.house}` : swindle.house;
  }

  function playSwindle(choice) {
    if (swindle.locked) return;
    swindle.locked = true;
    const roll = Math.random();
    const winner = roll < .15 ? 0 : roll < .25 ? 1 : 2;
    const won = choice === winner;
    swindle.plays += 1;
    swindle.wins += won ? 1 : 0;
    swindle.house += won ? -2 : 1;
    renderSwindle();
    $$('.cup').forEach((cup, index) => {
      cup.classList.add('lifted', index === choice);
      cup.classList.toggle('winner', index === winner);
      cup.classList.toggle('loser', index !== winner && index === choice);
    });
    $('#swindleStatus').textContent = won ? 'A miracle! Take 3 tickets.' : 'A tragic, completely normal loss.';
    setTimeout(() => {
      $$('.cup').forEach(cup => cup.classList.remove('lifted', 'winner', 'loser'));
      $('#swindleStatus').textContent = 'The dealer is definitely trustworthy.';
      swindle.locked = false;
    }, 1450);
  }

  const dice = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const diceCounts = Array(13).fill(0);
  let diceTotal = 0;
  function makeDiceChart() {
    $('#diceChart').innerHTML = Array.from({ length: 11 }, (_, i) => `<div class="bar-item"><i data-sum="${i + 2}" style="height:3px"></i><span>${i + 2}</span></div>`).join('');
  }
  function rollDice(times) {
    let a = 1, b = 1;
    for (let i = 0; i < times; i += 1) {
      a = 1 + Math.floor(Math.random() * 6);
      b = 1 + Math.floor(Math.random() * 6);
      diceCounts[a + b] += 1;
      diceTotal += 1;
    }
    $('#dieOne').textContent = dice[a - 1];
    $('#dieTwo').textContent = dice[b - 1];
    $$('.die').forEach(die => { die.classList.remove('rolling'); void die.offsetWidth; die.classList.add('rolling'); });
    const max = Math.max(1, ...diceCounts);
    $$('#diceChart i').forEach(bar => { bar.style.height = `${Math.max(2, diceCounts[Number(bar.dataset.sum)] / max * 100)}%`; });
    const leader = diceCounts.indexOf(max);
    $('#diceStatus').textContent = `${diceTotal} rolls · sum ${leader} currently leads with ${max}`;
  }

  let spinnerAngle = 0;
  const spinnerNames = ['RED', 'GOLD', 'TEAL', 'PINK'];
  function spin() {
    const addition = 900 + Math.floor(Math.random() * 360);
    spinnerAngle += addition;
    $('#spinnerWheel').style.transform = `rotate(${spinnerAngle}deg)`;
    const pointer = (360 - spinnerAngle % 360) % 360;
    const name = pointer < 45 ? spinnerNames[0] : pointer < 135 ? spinnerNames[1] : pointer < 225 ? spinnerNames[2] : spinnerNames[3];
    $('#spinnerResult').textContent = 'SPINNING…';
    setTimeout(() => { $('#spinnerResult').textContent = name; }, 1300);
  }

  const auditOffers = [
    { text: 'Pay 2 · Heads wins 4 · Tails wins 0', fair: true, why: 'Half of 4 is 2. The long run balances.' },
    { text: 'Pay 3 · Roll a 6 to win 12', fair: false, why: 'Average payout is 2. The booth keeps about 1.' },
    { text: 'Pay 4 · Draw a heart to win 16', fair: true, why: 'One quarter of the deck × 16 = 4.' },
    { text: 'Pay 2 · 40% chance to win 6', fair: false, why: 'Average payout is 2.4. This one favors the player!' }
  ];
  let auditIndex = 0;
  let auditVote = null;
  function renderAudit() {
    $('#auditOffer').textContent = auditOffers[auditIndex].text;
    $('#auditAnswer').textContent = 'Make the room commit.';
    $('#auditStamp').textContent = 'YOUR CALL';
    auditVote = null;
  }

  function audit(vote) {
    auditVote = vote;
    const correct = (vote === 'fair') === auditOffers[auditIndex].fair;
    $('#auditStamp').textContent = correct ? 'AUDITOR APPROVED' : 'LEGAL OBJECTS';
    $('#auditAnswer').textContent = auditOffers[auditIndex].why;
  }

  function updateRepair() {
    const chance = Number($('#chanceSlider').value);
    const prize = Number($('#prizeSlider').value);
    const cost = Number($('#costSlider').value);
    const net = chance / 100 * prize - cost;
    $('#chanceOut').textContent = `${chance}%`;
    $('#prizeOut').textContent = prize;
    $('#costOut').textContent = cost;
    $('#scaleBeam').style.setProperty('--balance', `${clamp(net * 4, -13, 13)}deg`);
    $('#fairnessMeter').style.width = `${clamp(50 + net * 8, 3, 97)}%`;
    $('#fairnessMeter').style.background = Math.abs(net) < .06 ? 'var(--good)' : 'var(--accent)';
    const verdict = $('#fairnessVerdict');
    verdict.className = `fairness-verdict ${Math.abs(net) < .06 ? 'fair' : 'foul'}`;
    verdict.textContent = Math.abs(net) < .06 ? 'BALANCED!' : net > 0 ? 'PLAYER EDGE' : 'HOUSE EDGE';
    $('#fairnessMath').textContent = `Average player change: ${net >= 0 ? '+' : ''}${net.toFixed(2)} tickets`;
  }

  function updateBuilder() {
    const chance = Number($('#builderChance').value);
    const prize = Number($('#builderPrize').value);
    const cost = Number($('#builderCost').value);
    $('#builderChanceOut').textContent = `${chance}%`;
    $('#builderPrizeOut').textContent = prize;
    $('#builderCostOut').textContent = cost;
  }

  function simulate(trials) {
    const chance = Number($('#builderChance').value) / 100;
    const prize = Number($('#builderPrize').value);
    const cost = Number($('#builderCost').value);
    let player = 0;
    const samples = [];
    for (let i = 1; i <= trials; i += 1) {
      player += (Math.random() < chance ? prize : 0) - cost;
      if (i % Math.max(1, Math.floor(trials / 28)) === 0) samples.push(player);
    }
    const min = Math.min(0, ...samples);
    const max = Math.max(0, ...samples);
    const range = Math.max(1, max - min);
    $('#simPlot').innerHTML = samples.map(value => `<i class="coin-stack" style="height:${18 + Math.abs(value) / range * 88}%;background:${value >= 0 ? 'var(--good)' : 'var(--accent)'}"></i>`).join('');
    const verdict = $('#simVerdict');
    verdict.textContent = player > 0 ? 'CROWD WINS' : player < 0 ? 'HOUSE WINS' : 'DEAD EVEN';
    verdict.className = `fairness-verdict ${player >= 0 ? 'fair' : 'foul'}`;
    $('#simResult').textContent = `${trials} visitors · players finish ${player >= 0 ? '+' : ''}${player} tickets`;
  }

  function bossSim() {
    let house = 0;
    for (let i = 0; i < 1000; i += 1) {
      const roll = Math.random();
      const payout = roll < .1 ? 18 : roll < .5 ? 3 : 0;
      house += 3 - payout;
    }
    $('#bossProfit').textContent = house >= 0 ? `+${house}` : house;
    $('#bossStatus').textContent = `tickets for the house · theory predicts about 0`;
  }

  let hintIndex = 0;
  const hints = ['What outcomes are possible?', 'Are those outcomes equally likely?', 'Track the average change per play.', 'Imagine the game running 1,000 times.'];

  document.addEventListener('click', event => {
    const cup = event.target.closest('.cup');
    if (cup) playSwindle(Number(cup.dataset.cup));
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'ticket-minus') { tickets = Math.max(0, tickets - 1); renderTickets(); }
    if (action === 'ticket-plus') { tickets = Math.min(20, tickets + 1); renderTickets(); }
    if (action === 'ticket-reset') { tickets = 10; renderTickets(); }
    if (action === 'swindle-reset') { swindle = { plays: 0, wins: 0, house: 0, locked: false }; renderSwindle(); }
    if (action === 'carnival-hint') { $('#carnivalHint').textContent = hints[hintIndex % hints.length]; hintIndex += 1; button.textContent = `Hint ${String(hintIndex + 1).padStart(2, '0')}`; }
    if (action === 'roll-dice') rollDice(Number(button.dataset.rolls));
    if (action === 'dice-reset') { diceCounts.fill(0); diceTotal = 0; makeDiceChart(); $('#diceStatus').textContent = 'No evidence yet.'; }
    if (action === 'spin') spin();
    if (action === 'audit-vote') audit(button.dataset.vote);
    if (action === 'audit-next') { auditIndex = (auditIndex + 1) % auditOffers.length; renderAudit(); }
    if (action === 'simulate') simulate(Number(button.dataset.trials));
    if (action === 'boss-sim') bossSim();
  });

  ['chanceSlider', 'prizeSlider', 'costSlider'].forEach(id => document.getElementById(id).addEventListener('input', updateRepair));
  ['builderChance', 'builderPrize', 'builderCost'].forEach(id => document.getElementById(id).addEventListener('input', updateBuilder));

  renderTickets();
  renderSwindle();
  makeDiceChart();
  renderAudit();
  updateRepair();
  updateBuilder();
})();
