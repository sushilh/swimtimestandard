let swimmingData;
let chartInstance;

fetch('new_age_group.json')
    .then(response => response.json())
    .then(data => {
        swimmingData = data.standards;
    })
    .catch(error => console.error('Error loading JSON:', error));

function populateAgeGroups() {
    const gender = document.getElementById('gender').value;
    const ageGroupSelect = document.getElementById('ageGroup');
    ageGroupSelect.innerHTML = '<option value="">Select Age Group</option>';

    if (gender) {
        const ageGroups = new Set();
        swimmingData.forEach(item => {
            if (item.gender === gender) {
                ageGroups.add(item.age_group);
            }
        });

        ageGroups.forEach(ageGroup => {
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

    if (gender && ageGroup) {
        const eventTypes = new Set();
        swimmingData.forEach(item => {
            if (item.gender === gender && item.age_group === ageGroup) {
                item.events.forEach(event => {
                    eventTypes.add(event.event);
                });
            }
        });

        eventTypes.forEach(eventType => {
            const option = document.createElement('option');
            option.value = eventType;
            option.textContent = eventType;
            eventTypeSelect.appendChild(option);
        });
    }
}

function showStandards() {
    const gender = document.getElementById('gender').value;
    const ageGroup = document.getElementById('ageGroup').value;
    const eventType = document.getElementById('eventType').value;
    const standardsTableBody = document.getElementById('standardsTable').getElementsByTagName('tbody')[0];
    standardsTableBody.innerHTML = '';

    if (gender && ageGroup && eventType) {
        let standards;
        swimmingData.forEach(item => {
            if (item.gender === gender && item.age_group === ageGroup) {
                item.events.forEach(event => {
                    if (event.event === eventType) {
                        standards = event.times;
                    }
                });
            }
        });

        if (standards) {
            const row = document.createElement('tr');
            const standardOrder = ["AAAA", "AAA", "AA", "A", "BB", "B"];
            standardOrder.forEach((standard) => {
                const cell = document.createElement('td');
                cell.textContent = standards[standard];
                row.appendChild(cell);
            });
            standardsTableBody.appendChild(row);
        }
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
    const userTimeStr = document.getElementById('time').value.trim();

    if (!userTimeStr || !gender || !ageGroup || !eventType) {
        document.getElementById('result').innerText = "Please fill in all fields.";
        return;
    }

    const userTimeSeconds = convertTimeToSeconds(userTimeStr);
    let standards = null;

    swimmingData.forEach(item => {
        if (item.gender === gender && item.age_group === ageGroup) {
            item.events.forEach(event => {
                if (event.event === eventType) {
                    standards = event.times;
                }
            });
        }
    });

    if (!standards) {
        document.getElementById('result').innerText = "Standards not found.";
        return;
    }

    const standardOrder = ["AAAA", "AAA", "AA", "A", "BB", "B"];
    let achievedStandard = "No standard achieved";
    let nextStandard = null;
    let secondsToNext = null;

    for (let i = 0; i < standardOrder.length; i++) {
        const standard = standardOrder[i];
        const standardTimeStr = standards[standard];
        const standardTimeSeconds = convertTimeToSeconds(standardTimeStr);

        if (userTimeSeconds <= standardTimeSeconds) {
            achievedStandard = standard;
            nextStandard = i > 0 ? standardOrder[i - 1] : null;
            if (nextStandard) {
                const nextStandardTimeSeconds = convertTimeToSeconds(standards[nextStandard]);
                secondsToNext = nextStandardTimeSeconds - userTimeSeconds;
            }
            break;
        }
    }

    let result = `Achieved ${achievedStandard} standard`;
    if (nextStandard) {
        result += `. Next standard to achieve is ${nextStandard}, ${Math.abs(secondsToNext).toFixed(2)} seconds away.`;
    }

    document.getElementById('result').innerText = result;

    // Highlight the achieved and next standards
    highlightStandards(achievedStandard, nextStandard);

    plotGraph(standards, standardOrder, userTimeSeconds);
}

function highlightStandards(achievedStandard, nextStandard) {
    const standardOrder = ["AAAA", "AAA", "AA", "A", "BB", "B"];
    const standardCells = document.querySelectorAll('#standardsTable td');

    standardCells.forEach((cell, index) => {
        cell.classList.remove('achieved', 'next');
        if (standardOrder[index] === achievedStandard) {
            cell.classList.add('achieved');
        }
        if (standardOrder[index] === nextStandard) {
            cell.classList.add('next');
        }
    });
}

function plotGraph(standards, standardOrder, userTime) {
    const ctx = document.getElementById('standardChart').getContext('2d');
    const times = standardOrder.map(standard => convertTimeToSeconds(standards[standard]));
    const labels = standardOrder;

    if (chartInstance) {
        chartInstance.destroy();
    }

    let lineColor = '#ff0000';
    for (let i = 0; i < times.length; i++) {
        if (userTime <= times[i]) {
            lineColor = '#00ff00';
            break;
        }
    }

    const userTimeLine = Array(labels.length).fill(userTime);

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
                data: userTimeLine,
                borderColor: lineColor,
                backgroundColor: lineColor,
                pointRadius: 0,
                fill: false,
                borderWidth: 2,
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
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

    // Scroll to top after chart is loaded
    window.scrollTo({ top: 0, behavior: 'smooth' });
}