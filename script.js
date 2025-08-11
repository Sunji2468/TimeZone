const fromSelect = document.getElementById('fromTimezone');
const toSelect = document.getElementById('toTimezone');
const resultDiv = document.getElementById('result');
const resultTime = document.getElementById('resultTime');
const fromTimeInput = document.getElementById('fromTime');

function getTimeZones() {
  if (typeof Intl.supportedValuesOf === 'function') {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch {}
  }
  return [
    "UTC","Etc/UTC","Europe/London","Europe/Paris","Europe/Berlin","Europe/Madrid","Europe/Rome",
    "America/New_York","America/Chicago","America/Denver","America/Los_Angeles","America/Toronto",
    "America/Sao_Paulo","Asia/Kolkata","Asia/Tokyo","Asia/Shanghai","Asia/Singapore","Asia/Dubai",
    "Australia/Sydney","Pacific/Auckland","Africa/Johannesburg"
  ];
}

function populateSelect(select, zones) {
  select.innerHTML = '';
  zones.forEach(tz => {
    const opt = document.createElement('option');
    opt.value = tz;
    opt.textContent = tz;
    select.add(opt);
  });
}

(function init() {
  const zones = getTimeZones();
  populateSelect(fromSelect, zones);
  populateSelect(toSelect, zones);

  fromSelect.value = zones.includes('UTC') ? 'UTC' : zones[0];
  toSelect.value = zones.includes('America/New_York') ? 'America/New_York' : zones[0];
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const localISO = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  fromTimeInput.value = localISO;
})();

function partsToNumberMap(parts) {
  const map = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  return map;
}

function getOffsetMinutes(utcDate, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = partsToNumberMap(dtf.formatToParts(utcDate));
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUTC - utcDate.getTime()) / 60000;
}

function localInTzToUTC({ year, month, day, hour, minute, second = 0 }, timeZone) {
  const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  let utcDate = new Date(guessUtcMs);

  let off1 = getOffsetMinutes(utcDate, timeZone);
  utcDate = new Date(guessUtcMs - off1 * 60000);

  let off2 = getOffsetMinutes(utcDate, timeZone);
  if (off2 !== off1) {
    utcDate = new Date(guessUtcMs - off2 * 60000);
  }

  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  const parts = partsToNumberMap(dtf.formatToParts(utcDate));

  const match =
    Number(parts.year) === year &&
    Number(parts.month) === month &&
    Number(parts.day) === day &&
    Number(parts.hour) === hour &&
    Number(parts.minute) === minute &&
    Number(parts.second) === second;
  let note = '';
  if (!match) {
    const earlier = new Date(utcDate.getTime() - 3600_000);
    const later = new Date(utcDate.getTime() + 3600_000);
    const fmt = d => partsToNumberMap(dtf.formatToParts(d));
    const e = fmt(earlier), l = fmt(later);

    const isAmbiguous =
      Number(e.year) === year && Number(e.month) === month && Number(e.day) === day &&
      Number(l.year) === year && Number(l.month) === month && Number(l.day) === day &&
      (Number(e.hour) === hour || Number(l.hour) === hour);

    note = isAmbiguous
      ? 'Note: The selected local time is ambiguous due to a DST “fall back”.'
      : 'Note: The selected local time does not exist due to a DST “spring forward”. Adjusted to the nearest valid instant.';
  }

  return { utcDate, note };
}

function convertTime() {
  const fromTz = fromSelect.value;
  const toTz = toSelect.value;
  const fromTimeStr = fromTimeInput.value;

  if (!fromTimeStr || !fromTz || !toTz) {
    alert("Please select both time zones and a date/time!");
    return;
  }

  const [d, t] = fromTimeStr.split('T');
  const [Y, M, D] = d.split('-').map(Number);
  const [h, m] = t.split(':').map(Number);

  const { utcDate, note } = localInTzToUTC(
    { year: Y, month: M, day: D, hour: h, minute: m, second: 0 },
    fromTz
  );

  const display = new Intl.DateTimeFormat('en-US', {
    timeZone: toTz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).format(utcDate);

  resultDiv.style.display = 'block';
  resultTime.textContent = `${display} (${toTz})${note ? ` — ${note}` : ''}`;
}

window.convertTime = convertTime;
