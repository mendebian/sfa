function showSection(className) {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    document.querySelector(className).style.display = 'flex';
}

let homeLeague = [],
    awayLeague = [];

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

// Função principal de simulação
function simule() {
    const setup = document.querySelector('.setup');
    const match = document.querySelector('.match');
    const homeDisplay = document.querySelector('.home-score');
    const awayDisplay = document.querySelector('.away-score');
    const score = document.querySelector('.score');
    const homeSummary = document.querySelector('.home-summary');
    const awaySummary = document.querySelector('.away-summary');
    const homeStats = document.querySelector('.home-stats');
    const awayStats = document.querySelector('.away-stats');
    const homeLineUp = document.querySelector('.home-lineup');
    const awayLineUp = document.querySelector('.away-lineup');
    const homeRatings = document.querySelector('.home-ratings');
    const awayRatings = document.querySelector('.away-ratings');
    const homeDebug = document.querySelector('.home-debug');
    const awayDebug = document.querySelector('.away-debug');
    const previusResults = document.querySelector('.previous-results');

    const homeMode = parseInt(document.getElementById('home-mode').value);
    const awayMode = parseInt(document.getElementById('away-mode').value);
    const selectHome = document.getElementById('home-team').value;
    const selectAway = document.getElementById('away-team').value;

    let homeData = getTeamData(selectHome, homeLeague);
    let awayData = getTeamData(selectAway, awayLeague);

    const homeLevel = calculateTeamLevel(homeData);
    const awayLevel = calculateTeamLevel(awayData);

    const cap = homeLevel + awayLevel;

    showSection('.match');

    homeDisplay.textContent = selectHome;
    awayDisplay.textContent = selectAway;

    let results = getPreviousResults();

    const modeAdjustments = getModeAdjustments(homeMode, awayMode);
    const goalProbs = calculateGoalProbabilities(homeLevel, awayLevel, modeAdjustments);

    // Simula as ações de jogo
    let { homeScore, awayScore, homeAttempts, awayAttempts, homeOnTarget, awayOnTarget, homePossession, awayPossession } = simulateMatch(
        cap, homeData, awayData, goalProbs, homeSummary, awaySummary
    );

    updateMatchStats(homeScore, awayScore, homeAttempts, awayAttempts, homeOnTarget, awayOnTarget, homePossession, awayPossession, score, homeStats, awayStats);
    updateLineUps(homeData, awayData, homeLineUp, awayLineUp);
    updateRatings(homeData, awayData, homeRatings, awayRatings);
    updateDebugInfo(homeLevel, awayLevel, homeMode, awayMode, homeDebug, awayDebug);

    storePreviousResults(selectHome, selectAway, homeScore, awayScore, homeMode, awayMode, results, previusResults);
}

// Funções auxiliares para refatoração

// Retorna os dados do time com o status "TITULAR"
function getTeamData(team, league) {
    return league.filter(player => player.EQUIPE === team && player.STATUS === 'TITULAR')
                 .map(player => ({ ...player, NOTA: 65 + random(10) }));
}

// Calcula o nível total do time
function calculateTeamLevel(data) {
    return data.reduce((total, player) => total + parseInt(player.NVL), 0);
}

// Calcula as probabilidades de gol com base no nível de cada time
function calculateGoalProbabilities(homeLevel, awayLevel, modeAdjustments) {
    const baseHomeGoalProb = 18;
    const baseAwayGoalProb = 15;
    const levelDifference = homeLevel - awayLevel;

    const homeGoalProb = baseHomeGoalProb + (levelDifference * 0.5);
    const awayGoalProb = baseAwayGoalProb - (levelDifference * 0.5);

    const normalizedHomeGoalProb = Math.max(5, Math.min(35, homeGoalProb));
    const normalizedAwayGoalProb = Math.max(5, Math.min(35, awayGoalProb));

    const finalHomeGoalProb = normalizedHomeGoalProb + modeAdjustments.homeAdj[0] + modeAdjustments.awayAdj[1];
    const finalAwayGoalProb = normalizedAwayGoalProb + modeAdjustments.awayAdj[0] + modeAdjustments.homeAdj[1];

    return { finalHomeGoalProb, finalAwayGoalProb };
}

// Calcula os ajustes de modo
function getModeAdjustments(homeMode, awayMode) {
    const modeAdjustments = [[-3, -9], [-2, -7], [3, -3], [7, 2], [9, 3]];
    return {
        homeAdj: modeAdjustments[homeMode],
        awayAdj: modeAdjustments[awayMode]
    };
}

// Simula o jogo, incluindo tentativas de gols e mudanças nos jogadores
function simulateMatch(cap, homeData, awayData, goalProbs, homeSummary, awaySummary) {
    let homeScore = 0, awayScore = 0;
    let homeAttempts = 0, awayAttempts = 0;
    let homeOnTarget = 0, awayOnTarget = 0;
    let homePossession = 0, awayPossession = 0;

    for (let i = 0; i < 19; i++) {
        const action = random(cap);
        const attempt = random(100);
        const timer = (i * 5) + Math.floor(Math.random() * 6) + 1;

        if (action < homeData.reduce((acc, player) => acc + parseInt(player.NVL), 0)) {
            homePossession++;
            if (attempt <= 80) {
                if (attempt <= 40) {
                    if (attempt <= goalProbs.finalHomeGoalProb) {
                        homeScore++;
                        processGoal(homeData, awayData, homeSummary, attempt, timer);
                    } else {
                        processMiss(homeData, awayData);
                    }
                    homeOnTarget++;
                } else {
                    processPass(homeData, awayData);
                }
                homeAttempts++;
            } else {
                processMiss(homeData, awayData);
            }
        } else {
            awayPossession++;
            if (attempt <= 80) {
                if (attempt <= 40) {
                    if (attempt <= goalProbs.finalAwayGoalProb) {
                        awayScore++;
                        processGoal(awayData, homeData, awaySummary, attempt, timer);
                    } else {
                        processMiss(awayData, homeData);
                    }
                    awayOnTarget++;
                } else {
                    processPass(awayData, homeData);
                }
                awayAttempts++;
            } else {
                processMiss(awayData, homeData);
            }
        }
    }

    return { homeScore, awayScore, homeAttempts, awayAttempts, homeOnTarget, awayOnTarget, homePossession, awayPossession };
}

// Processa um gol
function processGoal(scoringTeam, concedingTeam, summary, attempt, timer) {
    const assister = random(10);
    const scorer = random(10);
    scoringTeam[scorer].NOTA += 7;
    scoringTeam[assister].NOTA += 3;
    concedingTeam[0].NOTA -= 6;

    const li = document.createElement('li');
    li.innerHTML = `${timer.toString().padStart(2, '0')}' <strong>${scoringTeam[scorer].JOGADOR}</strong>${assister === scorer ? '' : ` (${scoringTeam[assister].JOGADOR})`}`;
    summary.appendChild(li);
}

// Processa um erro de gol
function processMiss(teamA, teamB) {
    for (let i = 0; i < 5; i++) {
        teamA[6 + i].NOTA -= 1;
    }
}

// Processa um passe
function processPass(teamA, teamB) {
    for (let i = 0; i < 5; i++) {
        teamB[1 + i].NOTA += 1;
    }
}

// Atualiza as estatísticas da partida
function updateMatchStats(homeScore, awayScore, homeAttempts, awayAttempts, homeOnTarget, awayOnTarget, homePossession, awayPossession, score, homeStats, awayStats) {
    score.innerHTML = `<strong>${homeScore}</strong>:<strong>${awayScore}</strong>`;

    const stats = [[
        homeAttempts, homeOnTarget, Math.round((homePossession / 19) * 100) + "%"
    ], [
        awayAttempts, awayOnTarget, Math.round((awayPossession / 19) * 100) + "%"
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

// Atualiza as escalações
function updateLineUps(homeData, awayData, homeLineUp, awayLineUp) {
    homeData.forEach(n => {
        const li = document.createElement('li');
        li.textContent = n.JOGADOR;
        homeLineUp.appendChild(li);
    });

    awayData.forEach(n => {
        const li = document.createElement('li');
        li.textContent = n.JOGADOR;
        awayLineUp.appendChild(li);
    });
}

// Atualiza as notas dos jogadores
function updateRatings(homeData, awayData, homeRatings, awayRatings) {
    homeData.forEach(n => {
        const li = document.createElement('li');
        const nota = n.NOTA > 100 ? 10 : n.NOTA < 0 ? 0 : n.NOTA / 10;
        li.textContent = nota.toFixed(1);
        homeRatings.appendChild(li);
    });

    awayData.forEach(n => {
        const li = document.createElement('li');
        const nota = n.NOTA > 100 ? 10 : n.NOTA < 0 ? 0 : n.NOTA / 10;
        li.textContent = nota.toFixed(1);
        awayRatings.appendChild(li);
    });
}

// Atualiza as informações de debug
function updateDebugInfo(homeLevel, awayLevel, homeMode, awayMode, homeDebug, awayDebug) {
    const modes = ["UDE", "DEF", "MOD", "OFF", "UOF"];
    homeDebug.innerHTML = `${modes[homeMode]} <strong>${homeLevel}</strong>`;
    awayDebug.innerHTML = `<strong>${awayLevel}</strong> ${modes[awayMode]}`;
}

// Recupera os resultados anteriores
function getPreviousResults() {
    return localStorage.getItem("previous_results") ? JSON.parse(localStorage.getItem("previous_results")) : [];
}

// Armazena os resultados anteriores
function storePreviousResults(selectHome, selectAway, homeScore, awayScore, homeMode, awayMode, results, previusResults) {
    results.forEach((n, index) => {
        if (index <= 2) {
            const li = document.createElement('li');
            li.textContent = `${n.home.team} ${n.home.score}:${n.away.score} ${n.away.team}`;
            previusResults.appendChild(li);
        }
    });

    results.unshift({
        home: {
            team: selectHome,
            score: homeScore,
            mode: homeMode,
        },
        away: {
            team: selectAway,
            score: awayScore,
            mode: awayMode,
        },
        timestamp: new Date().toLocaleString()
    });

    localStorage.setItem("previous_results", JSON.stringify(results));
}

function downloadPreviousResults() {
    const results = localStorage.getItem("previous_results");

    if (results) {
        const data = JSON.parse(results);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'previous_results.json';
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Função para gerar números aleatórios
function random(max) {
    let randomArray = new Uint32Array(1);
    window.crypto.getRandomValues(randomArray);
    return randomArray[0] % max + 1;
}