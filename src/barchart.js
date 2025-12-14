/**
 * Barchart Library v2
 * A modern, mode-driven JavaScript library for creating interactive bar charts
 */

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Get ISO week number for a date
 * @param {Date} date
 * @returns {number} Week number (1-53)
 */
function getWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Get the start of the week (Monday) for a date
 * @param {Date} date
 * @returns {Date}
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the start of the month for a date
 * @param {Date} date
 * @returns {Date}
 */
function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the start of the year for a date
 * @param {Date} date
 * @returns {Date}
 */
function getYearStart(date) {
  return new Date(date.getFullYear(), 0, 1);
}

/**
 * Format date as YYYY-MM
 * @param {Date} date
 * @returns {string}
 */
function formatMonth(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Format date as YYYY-Www
 * @param {Date} date
 * @returns {string}
 */
function formatWeek(date) {
  return `${date.getFullYear()}-W${String(getWeek(date)).padStart(2, '0')}`;
}

/**
 * Format date as YYYY
 * @param {Date} date
 * @returns {string}
 */
function formatYear(date) {
  return `${date.getFullYear()}`;
}

/**
 * Get weekday name
 * @param {Date} date
 * @returns {string}
 */
function getWeekdayName(date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

/**
 * Get month name
 * @param {Date} date
 * @returns {string}
 */
function getMonthName(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()];
}

// ============================================================================
// DATA AGGREGATION
// ============================================================================

/**
 * Aggregates plain data by the given mode ('byMonth', 'byWeek', etc.)
 * @param {Array} data - Array of {date, value}
 * @param {string} mode - One of 'byMonth', 'byWeek', 'byYear', 'byWeekday', 'byDay'
 * @returns {Array} Array of {date, value, highValue, lowValue}
 */
function aggregates(data, mode) {
  if (!data || data.length === 0) return [];

  // Normalize data
  const normalized = data.map(d => ({
    date: d.date instanceof Date ? d.date : new Date(d.date),
    value: Number(d.value),
    highValue: d.highValue !== undefined ? Number(d.highValue) : undefined,
    lowValue: d.lowValue !== undefined ? Number(d.lowValue) : undefined
  })).filter(d => !isNaN(d.date.getTime()) && !isNaN(d.value));

  // Group key function based on mode
  const getGroupKey = (date) => {
    switch (mode) {
      case 'byDay':
        return date.toISOString().split('T')[0];
      case 'byWeek':
        return formatWeek(date);
      case 'byMonth':
        return formatMonth(date);
      case 'byYear':
        return formatYear(date);
      case 'byWeekday':
        return String(date.getDay());
      default:
        return formatMonth(date);
    }
  };

  // Group data
  const groups = new Map();
  normalized.forEach(d => {
    const key = getGroupKey(d.date);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(d);
  });

  // Aggregate each group
  const result = [];
  groups.forEach((values, key) => {
    const allValues = values.map(v => v.value);
    const highValue = Math.max(...allValues);
    const lowValue = Math.min(...allValues);
    const avgValue = allValues.reduce((a, b) => a + b, 0) / allValues.length;

    result.push({
      date: key,
      value: Math.round(avgValue * 100) / 100,
      highValue: highValue,
      lowValue: lowValue,
      count: values.length
    });
  });

  // Sort by date key
  result.sort((a, b) => a.date.localeCompare(b.date));

  return result;
}

// ============================================================================
// MAIN CHART FUNCTION
// ============================================================================

/**
 * Create a barchart
 * @param {Object} config - Configuration object
 * @returns {SVGElement} The created SVG element
 */
function createBarchart(config) {
  // Default configuration
  const defaults = {
    container: null,
    data: [],
    chartType: 'byDay',      // byDay, byWeek, byMonth, byWeekday, byYear
    renderType: 'bar',       // bar, high-low
    width: 800,
    height: 400,
    margin: { top: 40, right: 30, bottom: 60, left: 60 },
    barColor: '#4a90d9',
    highLowColor: '#2c5aa0',
    avgMarkerColor: '#ff6b6b',
    showTooltip: true,
    showGrid: true,
    title: '',
    yAxisLabel: '',
    xAxisLabel: ''
  };

  const cfg = { ...defaults, ...config };
  const { width, height, margin } = cfg;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Normalize and validate data
  let data = cfg.data.map(d => ({
    date: d.date instanceof Date ? d.date : new Date(d.date),
    value: Number(d.value),
    highValue: d.highValue !== undefined ? Number(d.highValue) : undefined,
    lowValue: d.lowValue !== undefined ? Number(d.lowValue) : undefined
  })).filter(d => !isNaN(d.date.getTime()) && !isNaN(d.value));

  if (data.length === 0) {
    console.warn('No valid data points provided');
    return null;
  }

  // Aggregate data based on chartType
  let aggregatedData;
  if (cfg.chartType !== 'byDay' || cfg.renderType === 'high-low') {
    aggregatedData = aggregates(data, cfg.chartType);
  } else {
    // No aggregation for byDay with bar renderType
    aggregatedData = data.map(d => ({
      date: d.date.toISOString().split('T')[0],
      value: d.value,
      highValue: d.highValue || d.value,
      lowValue: d.lowValue || d.value,
      count: 1
    }));
  }

  // Calculate Y scale
  let minValue, maxValue;
  if (cfg.renderType === 'high-low') {
    minValue = Math.min(...aggregatedData.map(d => d.lowValue));
    maxValue = Math.max(...aggregatedData.map(d => d.highValue));
  } else {
    minValue = 0;
    maxValue = Math.max(...aggregatedData.map(d => d.value));
  }

  // Add padding to y-axis
  const yPadding = (maxValue - minValue) * 0.1 || 10;
  if (cfg.renderType === 'high-low') {
    minValue = Math.max(0, minValue - yPadding);
  }
  maxValue = maxValue + yPadding;

  const yScale = (value) => {
    return innerHeight - ((value - minValue) / (maxValue - minValue)) * innerHeight;
  };

  // Create SVG
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('class', 'barchart');

  // Main group with margins
  const g = document.createElementNS(svgNS, 'g');
  g.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);
  svg.appendChild(g);

  // Draw grid
  if (cfg.showGrid) {
    const gridGroup = document.createElementNS(svgNS, 'g');
    gridGroup.setAttribute('class', 'grid');
    
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      const y = (innerHeight / tickCount) * i;
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', innerWidth);
      line.setAttribute('y2', y);
      line.setAttribute('class', 'grid-line');
      gridGroup.appendChild(line);
    }
    g.appendChild(gridGroup);
  }

  // Draw Y axis
  const yAxisGroup = document.createElementNS(svgNS, 'g');
  yAxisGroup.setAttribute('class', 'y-axis');

  const yAxisLine = document.createElementNS(svgNS, 'line');
  yAxisLine.setAttribute('x1', 0);
  yAxisLine.setAttribute('y1', 0);
  yAxisLine.setAttribute('x2', 0);
  yAxisLine.setAttribute('y2', innerHeight);
  yAxisLine.setAttribute('class', 'axis-line');
  yAxisGroup.appendChild(yAxisLine);

  // Y axis ticks and labels
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    const value = minValue + ((maxValue - minValue) / tickCount) * (tickCount - i);
    const y = (innerHeight / tickCount) * i;

    const tick = document.createElementNS(svgNS, 'line');
    tick.setAttribute('x1', -5);
    tick.setAttribute('y1', y);
    tick.setAttribute('x2', 0);
    tick.setAttribute('y2', y);
    tick.setAttribute('class', 'axis-tick');
    yAxisGroup.appendChild(tick);

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', -10);
    label.setAttribute('y', y + 4);
    label.setAttribute('class', 'axis-label');
    label.setAttribute('text-anchor', 'end');
    label.textContent = Math.round(value);
    yAxisGroup.appendChild(label);
  }

  // Y axis label
  if (cfg.yAxisLabel) {
    const yLabel = document.createElementNS(svgNS, 'text');
    yLabel.setAttribute('transform', `rotate(-90)`);
    yLabel.setAttribute('x', -innerHeight / 2);
    yLabel.setAttribute('y', -45);
    yLabel.setAttribute('class', 'axis-title');
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.textContent = cfg.yAxisLabel;
    yAxisGroup.appendChild(yLabel);
  }

  g.appendChild(yAxisGroup);

  // Calculate bar dimensions
  const barCount = aggregatedData.length;
  const barPadding = 0.2;
  const barWidth = Math.max(1, (innerWidth / barCount) * (1 - barPadding));
  const barStep = innerWidth / barCount;

  // Draw X axis
  const xAxisGroup = document.createElementNS(svgNS, 'g');
  xAxisGroup.setAttribute('class', 'x-axis');
  xAxisGroup.setAttribute('transform', `translate(0, ${innerHeight})`);

  const xAxisLine = document.createElementNS(svgNS, 'line');
  xAxisLine.setAttribute('x1', 0);
  xAxisLine.setAttribute('y1', 0);
  xAxisLine.setAttribute('x2', innerWidth);
  xAxisLine.setAttribute('y2', 0);
  xAxisLine.setAttribute('class', 'axis-line');
  xAxisGroup.appendChild(xAxisLine);

  // X axis labels with intelligent thinning
  const maxLabels = Math.floor(innerWidth / 60);
  const labelStep = Math.max(1, Math.ceil(barCount / maxLabels));
  const processedYears = new Set();

  aggregatedData.forEach((d, i) => {
    const x = i * barStep + barStep / 2;

    // Tick mark
    const tick = document.createElementNS(svgNS, 'line');
    tick.setAttribute('x1', x);
    tick.setAttribute('y1', 0);
    tick.setAttribute('x2', x);
    tick.setAttribute('y2', 5);
    tick.setAttribute('class', 'axis-tick');
    xAxisGroup.appendChild(tick);

    // Label (with thinning)
    if (i % labelStep === 0) {
      let labelText = d.date;
      
      // Format label based on chartType
      if (cfg.chartType === 'byWeekday') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        labelText = days[parseInt(d.date)];
      } else if (cfg.chartType === 'byMonth') {
        const [year, month] = d.date.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        labelText = monthNames[parseInt(month) - 1];
        
        // Add year label if first occurrence
        if (!processedYears.has(year)) {
          processedYears.add(year);
          const yearLabel = document.createElementNS(svgNS, 'text');
          yearLabel.setAttribute('x', x);
          yearLabel.setAttribute('y', 35);
          yearLabel.setAttribute('class', 'year-label');
          yearLabel.setAttribute('text-anchor', 'middle');
          yearLabel.textContent = year;
          xAxisGroup.appendChild(yearLabel);
        }
      } else if (cfg.chartType === 'byWeek') {
        const [year, week] = d.date.split('-W');
        labelText = `W${week}`;
        
        if (!processedYears.has(year)) {
          processedYears.add(year);
          const yearLabel = document.createElementNS(svgNS, 'text');
          yearLabel.setAttribute('x', x);
          yearLabel.setAttribute('y', 35);
          yearLabel.setAttribute('class', 'year-label');
          yearLabel.setAttribute('text-anchor', 'middle');
          yearLabel.textContent = year;
          xAxisGroup.appendChild(yearLabel);
        }
      }

      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', x);
      label.setAttribute('y', 20);
      label.setAttribute('class', 'axis-label');
      label.setAttribute('text-anchor', 'middle');
      label.textContent = labelText;
      xAxisGroup.appendChild(label);
    }
  });

  // X axis label
  if (cfg.xAxisLabel) {
    const xLabel = document.createElementNS(svgNS, 'text');
    xLabel.setAttribute('x', innerWidth / 2);
    xLabel.setAttribute('y', 50);
    xLabel.setAttribute('class', 'axis-title');
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.textContent = cfg.xAxisLabel;
    xAxisGroup.appendChild(xLabel);
  }

  g.appendChild(xAxisGroup);

  // Draw bars
  const barsGroup = document.createElementNS(svgNS, 'g');
  barsGroup.setAttribute('class', 'bars');

  // Tooltip element
  let tooltip = null;
  if (cfg.showTooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
  }

  aggregatedData.forEach((d, i) => {
    const x = i * barStep + (barStep - barWidth) / 2;

    if (cfg.renderType === 'high-low') {
      // High-low bar
      const barGroup = document.createElementNS(svgNS, 'g');
      barGroup.setAttribute('class', 'high-low-bar');

      // Range bar (low to high)
      const rangeBar = document.createElementNS(svgNS, 'rect');
      const yHigh = yScale(d.highValue);
      const yLow = yScale(d.lowValue);
      rangeBar.setAttribute('x', x);
      rangeBar.setAttribute('y', yHigh);
      rangeBar.setAttribute('width', barWidth);
      rangeBar.setAttribute('height', Math.max(1, yLow - yHigh));
      rangeBar.setAttribute('class', 'bar high-low');
      rangeBar.setAttribute('fill', cfg.highLowColor);
      barGroup.appendChild(rangeBar);

      // Average marker
      const avgY = yScale(d.value);
      const avgMarker = document.createElementNS(svgNS, 'line');
      avgMarker.setAttribute('x1', x - 2);
      avgMarker.setAttribute('y1', avgY);
      avgMarker.setAttribute('x2', x + barWidth + 2);
      avgMarker.setAttribute('y2', avgY);
      avgMarker.setAttribute('class', 'avg-marker');
      avgMarker.setAttribute('stroke', cfg.avgMarkerColor);
      avgMarker.setAttribute('stroke-width', 3);
      barGroup.appendChild(avgMarker);

      // Tooltip events
      if (cfg.showTooltip) {
        barGroup.addEventListener('mouseenter', (e) => {
          tooltip.innerHTML = `
            <strong>${d.date}</strong><br>
            High: ${d.highValue}<br>
            Low: ${d.lowValue}<br>
            Avg: ${d.value}
          `;
          tooltip.style.display = 'block';
          tooltip.style.left = e.pageX + 10 + 'px';
          tooltip.style.top = e.pageY - 10 + 'px';
        });
        barGroup.addEventListener('mousemove', (e) => {
          tooltip.style.left = e.pageX + 10 + 'px';
          tooltip.style.top = e.pageY - 10 + 'px';
        });
        barGroup.addEventListener('mouseleave', () => {
          tooltip.style.display = 'none';
        });
      }

      barsGroup.appendChild(barGroup);
    } else {
      // Standard bar
      const barHeight = Math.max(1, innerHeight - yScale(d.value));
      const bar = document.createElementNS(svgNS, 'rect');
      bar.setAttribute('x', x);
      bar.setAttribute('y', yScale(d.value));
      bar.setAttribute('width', barWidth);
      bar.setAttribute('height', barHeight);
      bar.setAttribute('class', 'bar');
      bar.setAttribute('fill', cfg.barColor);

      // Tooltip events
      if (cfg.showTooltip) {
        bar.addEventListener('mouseenter', (e) => {
          tooltip.innerHTML = `<strong>${d.date}</strong><br>Value: ${d.value}`;
          tooltip.style.display = 'block';
          tooltip.style.left = e.pageX + 10 + 'px';
          tooltip.style.top = e.pageY - 10 + 'px';
        });
        bar.addEventListener('mousemove', (e) => {
          tooltip.style.left = e.pageX + 10 + 'px';
          tooltip.style.top = e.pageY - 10 + 'px';
        });
        bar.addEventListener('mouseleave', () => {
          tooltip.style.display = 'none';
        });
      }

      barsGroup.appendChild(bar);
    }
  });

  g.appendChild(barsGroup);

  // Title
  if (cfg.title) {
    const title = document.createElementNS(svgNS, 'text');
    title.setAttribute('x', width / 2);
    title.setAttribute('y', 25);
    title.setAttribute('class', 'chart-title');
    title.setAttribute('text-anchor', 'middle');
    title.textContent = cfg.title;
    svg.appendChild(title);
  }

  // Append to container if provided
  if (cfg.container) {
    const container = typeof cfg.container === 'string' 
      ? document.querySelector(cfg.container) 
      : cfg.container;
    if (container) {
      container.appendChild(svg);
    }
  }

  return svg;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createBarchart, aggregates, getWeek, getWeekStart, getMonthStart, getYearStart };
}
