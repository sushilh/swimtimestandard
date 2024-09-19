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

function populateEventTypes() {
    const gender = document.getElementById('gender').value;
    const ageGroup = document.getElementById('ageGroup').value;
    const eventTypeSelect = document.getElementById('eventType');
    eventTypeSelect.innerHTML = '<option value="">Select Event Type</option>';

    if (gender && ageGroup && swimmingData[gender][ageGroup]) {
        Object.keys(swimmingData[gender][ageGroup]).forEach(eventType => {
            const option = document.createElement('option');
            option.value = eventType;
            option.textContent = eventType;
            eventTypeSelect.appendChild(option);
        });
    }
}

function populateDistances() {
    const gender = document.getElementById('gender').value;
    const ageGroup = document.getElementById('ageGroup').value;
    const eventType = document.getElementById('eventType').value;
    const distanceSelect = document.getElementById('distance');
    distanceSelect.innerHTML = '<option value="">Select Distance</option>';

    if (gender && ageGroup && eventType && swimmingData[gender][ageGroup][eventType]) {
        Object.keys(swimmingData[gender][ageGroup][eventType]).forEach(distance => {
            const option = document.createElement('option');
            option.value = distance;
            option.textContent = `${distance} Y`;
            distanceSelect.appendChild(option);
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
    const eventType = document.getElementById('eventType').value;
    const distance = document.getElementById('distance').value;
    const userTimeStr = document.getElementById('time').value.trim();

    if (!userTimeStr || !gender || !ageGroup || !eventType || !distance) {
        document.getElementById('result').innerText = "Please fill in all fields.";
        return;
    }

    const userTimeSeconds = convertTimeToSeconds(userTimeStr);
    const standards = swimmingData[gender][ageGroup][eventType][distance];

    const standardOrder = ["AAAA", "AAA", "AA", "A", "BB", "B"];
    let achievedStandard = "No standard achieved";
    let nextStandard = null;
    let secondsToNext = null;

    const times = [];
    const labels = [];

    for (let i = 0; i < standardOrder.length; i++) {
        const standard = standardOrder[i];
        const standardTimeStr = standards[standard];
        const standardTimeSeconds = convertTimeToSeconds(standardTimeStr);

        if (userTimeSeconds <= standardTimeSeconds) {
            achievedStandard = `Achieved ${standard} standard`;
            nextStandard = i > 0 ? standardOrder[i - 1] : null;
            if (nextStandard) {
                const nextStandardTimeSeconds = convertTimeToSeconds(standards[nextStandard]);
                secondsToNext = nextStandardTimeSeconds - userTimeSeconds;
            }
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
        if (secondsToNext !== null) {
            result += `, ${secondsToNext.toFixed(2)} seconds away.`;
        }
    }

    document.getElementById('result').innerText = result;

    plotGraph(times, labels, userTimeSeconds);
}
function plotGraph(times, labels, userTime) {
    const ctx = document.getElementById('standardChart').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    // Determine the color of the dot based on whether the user's time is within any standard
    let dotColor = '#ff0000'; // Default to red (meaning not achieved)
    for (let i = 0; i < times.length; i++) {
        if (userTime <= times[i]) {
            dotColor = '#00ff00'; // Change to green if the user achieves any standard
            break;
        }
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
                borderColor: dotColor,
                backgroundColor: dotColor,
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


