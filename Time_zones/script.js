const fromSelect = document.getElementById('fromTimezone');
const toSelect = document.getElementById('toTimezone');
const resultDiv = document.getElementById('result');
const resultTime = document.getElementById('resultTime');
async function loadTimezones() {
    try {
        const response = await fetch('https://worldtimeapi.org/api/timezone');
        const timezones = await response.json();
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';
        timezones.forEach(tz => {
            const optionFrom = document.createElement('option');
            optionFrom.value = tz;
            optionFrom.text = tz;
            fromSelect.add(optionFrom);

            const optionTo = document.createElement('option');
            optionTo.value = tz;
            optionTo.text = tz;
            toSelect.add(optionTo);
        });
        fromSelect.value = "UTC";
        toSelect.value = "America/New_York";
    } catch (err) {
        fromSelect.innerHTML = '<option>Error loading timezones</option>';
        toSelect.innerHTML = '<option>Error loading timezones</option>';
        alert('Failed to load time zones');
    }
}

loadTimezones();
async function convertTime() {
    const fromTz = fromSelect.value;
    const toTz = toSelect.value;
    const fromTimeStr = document.getElementById('fromTime').value;

    if (!fromTimeStr || !fromTz || !toTz) {
        alert("Please select both time zones and a date/time!");
        return;
    }
    const fromDate = new Date(fromTimeStr);
    const fromResp = await fetch(`https://worldtimeapi.org/api/timezone/${fromTz}`);
    const fromData = await fromResp.json();
    const fromOffsetMinutes = fromData.utc_offset ? parseOffsetMinutes(fromData.utc_offset) : 0;

    const utcTime = new Date(fromDate.getTime() - (fromOffsetMinutes * 60 * 1000));

    
    const toResp = await fetch(`https://worldtimeapi.org/api/timezone/${toTz}`);
    const toData = await toResp.json();
    const toOffsetMinutes = toData.utc_offset ? parseOffsetMinutes(toData.utc_offset) : 0;

    const targetDate = new Date(utcTime.getTime() + (toOffsetMinutes * 60 * 1000));
    const displayDate = targetDate.toLocaleString('en-US', {
        timeZone: toTz,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    });

    resultDiv.style.display = "block";
    resultTime.textContent = displayDate + " (" + toTz + ")";
}
function parseOffsetMinutes(offset) {
    const sign = offset.startsWith('-') ? -1 : 1;
    const [hours, mins] = offset.slice(1).split(':').map(Number);
    return sign * (hours * 60 + mins);
}
