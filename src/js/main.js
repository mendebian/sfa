let homeLeague = [];
let awayLeague = [];

async function getSheet(league) {
    try {
        const response = await fetch(`https://opensheet.elk.sh/1d6PHvD5VGq1mlxbr7_Nwab9WNngXj-sFaN4btjIRqMo/${league}`);
        const data = await response.json();

        return data;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function getHomeLeague() {
    const league = document.getElementById('home-league').value;
    try {
        const data = await getSheet(league);

        dropdown('home-team', data);
        homeLeague = data;
    } catch (err) {
        console.error('Error fetching home league data:', err);
    }
}

async function getAwayLeague() {
    const league = document.getElementById('away-league').value;
    try {
        const data = await getSheet(league);

        dropdown('away-team', data);
        awayLeague = data;
    } catch (err) {
        console.error('Error fetching away league data:', err);
    }
}

function dropdown(id, data) {
    const select = document.getElementById(id);
    select.innerHTML = '';

    const teamsSet = new Set();
    data.forEach(player => {
        teamsSet.add(player.EQUIPE);
    });

    teamsSet.forEach(team => {
        const option = document.createElement('option');

        option.value = team;
        option.textContent = team;
        select.appendChild(option);
    });
}

function simule() {
    const selectHome = document.getElementById('home-team').value;
    const selectAway = document.getElementById('away-team').value;

    const homeData = homeLeague.filter(player => player.EQUIPE === selectHome && player.STATUS === 'TITULAR');
    const awayData = awayLeague.filter(player => player.EQUIPE === selectAway && player.STATUS === 'TITULAR');
    
    const homeLevel = homeData.reduce((total, player) => total + parseInt(player.NVL), 0);
    const awayLevel = awayData.reduce((total, player) => total + parseInt(player.NVL), 0);

    const cap = homeLevel + awayLevel;

    const setup = document.querySelector('.setup');
    const match = document.querySelector('.match');
    const homeDisplay = document.querySelector('.home-score');
    const awayDisplay = document.querySelector('.away-score');
    const score = document.querySelector('.score');
    const homeMode = parseInt(document.getElementById('home-mode').value);
    const awayMode = parseInt(document.getElementById('away-mode').value);
    const homeSummary = document.querySelector('.home-summary');
    const awaySummary = document.querySelector('.away-summary');
    const homeStats = document.querySelector('.home-stats');
    const awayStats = document.querySelector('.away-stats');

    setup.style.display = 'none';
    match.style.display = 'block';

    homeDisplay.textContent = selectHome;
    awayDisplay.textContent = selectAway;

    let homeScore = 0, awayScore = 0, homeAttempts = 0, awayAttempts = 0, homeOnTarget = 0, awayOnTarget = 0, homePossession = 0, awayPossession = 0;
    
    const modeAdjustments = [[-3, -9], [-2, -7], [3, -3], [7, 2], [9, 3]];

    const homeAdj = modeAdjustments[homeMode];
    const awayAdj = modeAdjustments[awayMode];
    
    const homeGoalProb = 15 + homeAdj[0] + awayAdj[1];
    const awayGoalProb = 15 + awayAdj[0] + homeAdj[1];
    
    function random(max) {
        let randomArray = new Uint32Array(1);
        window.crypto.getRandomValues(randomArray);
        return randomArray[0] % max + 1;
    }

    for (let i = 0; i < 19; i++) {
        const action = random(cap);
        const attempt = random(100);
        const timer = (i * 5) + Math.floor(Math.random() * 6) + 1;

        if (action < homeLevel) {
            homePossession++;
            if (attempt <= 80) {
                if (attempt <= 40) {
                    if (attempt <= homeGoalProb) {
                        homeScore++;

                        const assister = random(10);
                        const scorer = random(10);
                        const li = document.createElement('li');
                        li.innerHTML = `${timer.toString().padStart(2, '0')}' <strong>${homeData[scorer].JOGADOR}</strong> (${homeData[assister].JOGADOR})` ;
                        homeSummary.appendChild(li);
                    }
                    homeOnTarget++;
                }
                homeAttempts++
            }
        } else {
            awayPossession++;
            if (attempt <= 80) {
                if (attempt <= 40) {
                    if (attempt <= awayGoalProb) {
                        awayScore++;

                        const assister = random(10);
                        const scorer = random(10);
                        const li = document.createElement('li');
                        li.innerHTML = `<strong>${awayData[scorer].JOGADOR}</strong> (${awayData[assister].JOGADOR}) ${timer.toString().padStart(2, '0')}'` ;
                        awaySummary.appendChild(li);
                    }
                    awayOnTarget++;
                }
                awayAttempts++;
            }
        }
    }

    score.innerHTML = `<strong>${homeScore}</strong>:<strong>${awayScore}</strong>`;

    const stats = [[
        homeAttempts,
        homeOnTarget,
        Math.round((homePossession / 19) * 100) + "%"
    ], [
        awayAttempts,
        awayOnTarget,
        Math.round((awayPossession / 19) * 100) + "%"
    ]];

    stats[0].forEach(n => {
        const li = document.createElement('li');
        li.textContent = n;
        homeStats.appendChild(li);
    });

    stats[1].forEach(n => {
        const li = document.createElement('li');
        li.textContent = n;
        awayStats.appendChild(li);
    });
}
