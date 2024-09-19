let swimmingData;
let chartInstance;

fetch('age_groups.json')
    .then(response => response.json())
    .then(data => {
        swimmingData = data;
    })
    .catch(error => console.error('Error loading JSON:', error));

function populateAgeGroups() {
    const gender = document.getElementById('gender').value;
    const ageGroupSelect = document.getElementById('ageGroup');
    ageGroupSelect.innerHTML = '<option value="">Select Age Group</option>';

    if (gender && swimmingData[gender]) {
        Object.keys(swimmingData[gender]).forEach(ageGroup => {
            const option = document.createElement('option');
            option.value = ageGroup;
            option.textContent = ageGroup;
            ageGroupSelect.appendChild(option);
        });
    }
}

function populateEvents() {
    const gender = document.getElementById('gender').value;
    const ageGroup = document.getElementById('ageGroup').value;
    const eventSelect = document.getElementById('event');
    eventSelect.innerHTML = '<option value="">Select Event</option>';

    if (gender && ageGroup && swimmingData[gender][ageGroup]) {
        Object.keys(swimmingData[gender][ageGroup]).forEach(event => {
            const option = document.createElement('option');
            option.value = event;
            option.textContent = event;
            eventSelect.appendChild(option);
        });
    }
}

function convertTimeToSeconds(timeStr) {
    const parts = timeStr.split(':');
    let seconds = 0;
    if (parts.length === 2) {
        const [min, sec] = parts;
        seconds = parseFloat(min) * 60 + parseFloat(sec);
    } else {
        seconds = parseFloat(timeStr);
    }
    return seconds;
}

function checkStandard() {
    const gender = document.getElementById('gender').value;
    const ageGroup = document.getElementById('ageGroup').value;
    const event = document.getElementById('event').value;
    const userTimeStr = document.getElementById('time').value.trim();

    if (!userTimeStr || !gender || !ageGroup || !event) {
        document.getElementById('result').innerText = "Please fill in all fields.";
        return;
    }

    const userTimeSeconds = convertTimeToSeconds(userTimeStr);
    const standards = swimmingData[gender][ageGroup][event];

    const standardOrder = ["AAAA", "AAA", "AA", "A", "BB", "B"];
    let achievedStandard = "No standard achieved";
    let nextStandard = null;

    const times = [];
    const labels = [];

    for (let i = 0; i < standardOrder.length; i++) {
        const standard = standardOrder[i];
        const standardTimeStr = standards[standard];
        const standardTimeSeconds = convertTimeToSeconds(standardTimeStr);

        if (userTimeSeconds <= standardTimeSeconds) {
            achievedStandard = `Achieved ${standard} standard`;
            nextStandard = i > 0 ? standardOrder[i - 1] : null;
            break;
        }

        nextStandard = standard;
    }

    for (let i = 0; i < standardOrder.length; i++) {
        const standard = standardOrder[i];
        const standardTimeStr = standards[standard];
        const seconds = convertTimeToSeconds(standardTimeStr);
        times.push(seconds);
        labels.push(standard);
    }

    let result = `${achievedStandard}`;
    if (nextStandard) {
        result += `. Next standard to achieve is ${nextStandard}`;
    }

    document.getElementById('result').innerText = result;

    plotGraph(times, labels, userTimeSeconds);
}

function plotGraph(times, labels, userTime) {
    const ctx = document.getElementById('standardChart').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Standards Time',
                data: times,
                borderColor: '#0061ff',
                fill: false
            }, {
                label: 'Your Time',
                data: [{x: labels[0], y: userTime}], // Place the dot at the beginning
                borderColor: '#ff0000',
                backgroundColor: '#ff0000',
                type: 'scatter',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    reverse: true,
                    ticks: {
                        stepSize: 30,
                        callback: function(value) {
                            const minutes = Math.floor(value / 60);
                            const seconds = value % 60;
                            return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}
