/**
 * Barchart Library v2
 * A modern, mode-driven JavaScript library for creating interactive bar charts
 * 
 * Features:
 * - Multiple chart types with shared x-axis
 * - Horizontal scrolling with sticky y-axis
 * - ES Module / UMD compatible
 */

(function(root, factory) {
  // UMD pattern for compatibility
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS / Node
    module.exports = factory();
  } else {
    // Browser globals
    root.Barchart = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

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

  /**
   * Round a number up to a "nice" value for axis ticks
   * Nice numbers are: 1, 2, 5, 10, 20, 50, 100, 200, 500, etc.
   * @param {number} value - The value to round up
   * @returns {number} The next nice number >= value
   */
  function niceNumberCeil(value) {
    if (value <= 0) return 0;
    
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const normalized = value / magnitude;
    
    // Round up to next nice number: 1, 2, 4, 5, 6, 8, or 10
    const niceNumbers = [1, 2, 4, 5, 6, 8, 10];
    let niceNormalized = 10;
    for (const n of niceNumbers) {
      if (normalized <= n) {
        niceNormalized = n;
        break;
      }
    }
    
    return niceNormalized * magnitude;
  }

  /**
   * Add thousand separators to a number string
   * @param {string} numStr - The number string to format
   * @returns {string} Number string with thousand separators
   */
  function addThousandSeparators(numStr) {
    const parts = numStr.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  /**
   * Format large numbers with K, M, B suffixes
   * @param {number} value - The number to format
   * @param {string} format - Format type: 'auto', 'K', 'M', 'B', or 'none'
   * @param {number} decimals - Number of decimal places (default: 2)
   * @param {boolean} useThousandSeparator - Whether to add thousand separators (default: true)
   * @returns {string} Formatted number string
   */
  function formatNumber(value, format = 'auto', decimals = 2, useThousandSeparator = true) {
    if (value === 0) {
      return '0';
    }
    
    if (format === 'none') {
      const rounded = String(Math.round(value));
      return useThousandSeparator ? addThousandSeparators(rounded) : rounded;
    }

    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    let suffix = '';
    let divisor = 1;

    if (format === 'auto') {
      if (absValue >= 1e9) {
        suffix = 'B';
        divisor = 1e9;
      } else if (absValue >= 1e6) {
        suffix = 'M';
        divisor = 1e6;
      } else if (absValue >= 1e3) {
        suffix = 'K';
        divisor = 1e3;
      }
    } else if (format === 'B') {
      suffix = 'B';
      divisor = 1e9;
    } else if (format === 'M') {
      suffix = 'M';
      divisor = 1e6;
    } else if (format === 'K') {
      suffix = 'K';
      divisor = 1e3;
    }

    if (divisor === 1) {
      const numStr = absValue.toFixed(decimals).replace(/\.?0+$/, '');
      return sign + (useThousandSeparator ? addThousandSeparators(numStr) : numStr);
    }

    const formatted = (absValue / divisor).toFixed(decimals);
    // Remove trailing zeros but keep at least one decimal if needed
    const cleaned = formatted.replace(/\.?0+$/, '');
    return sign + cleaned + suffix;
  }

  // ============================================================================
  // DATA AGGREGATION
  // ============================================================================

  /**
   * Aggregates plain data by the given mode ('byMonth', 'byWeek', etc.)
   * @param {Array} data - Array of {date, value}
   * @param {string} mode - One of 'byMonth', 'byWeek', 'byYear', 'byWeekday', 'byDay'
   * @returns {Array} Array of {date, value, highValue, lowValue, count}
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
  // SVG HELPER
  // ============================================================================

  const svgNS = 'http://www.w3.org/2000/svg';

  function createSVGElement(tag, attrs = {}) {
    const el = document.createElementNS(svgNS, tag);
    for (const [key, val] of Object.entries(attrs)) {
      el.setAttribute(key, val);
    }
    return el;
  }

  // ============================================================================
  // TOOLTIP POSITIONING
  // ============================================================================

  /**
   * Position tooltip next to mouse cursor, keeping it within viewport
   * @param {HTMLElement} tooltip - The tooltip element
   * @param {MouseEvent} e - The mouse event
   */
  function positionTooltip(tooltip, e) {
    const offset = 12;
    const padding = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Get tooltip dimensions (make visible briefly to measure if needed)
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width || 150;
    const tooltipHeight = tooltipRect.height || 50;
    
    // Calculate position, ensuring tooltip stays within viewport
    let left = e.clientX + offset;
    let top = e.clientY - offset;
    
    // Adjust if tooltip would overflow right edge
    if (left + tooltipWidth + padding > viewportWidth) {
      left = e.clientX - tooltipWidth - offset;
    }
    
    // Adjust if tooltip would overflow bottom edge
    if (top + tooltipHeight + padding > viewportHeight) {
      top = e.clientY - tooltipHeight - offset;
    }
    
    // Ensure tooltip doesn't go off left or top edge
    left = Math.max(padding, left);
    top = Math.max(padding, top);
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  // ============================================================================
  // SINGLE CHART RENDERER
  // ============================================================================

  /**
   * Render a single chart panel (for use in multi-chart or standalone)
   * @param {Object} cfg - Chart configuration
   * @param {Array} aggregatedData - Pre-aggregated data
   * @param {number} barStep - Bar step width
   * @param {number} barWidth - Bar width
   * @param {Object} tooltip - Shared tooltip element
   * @returns {Object} { yAxisSvg, chartSvg }
   */
  function renderChartPanel(cfg, aggregatedData, barStep, barWidth, tooltip) {
    const { innerWidth, innerHeight, margin } = cfg;
    const useLogScale = cfg.yAxisScale === 'log10';
    const numberFormat = cfg.yAxisFormat || 'auto';
    const numberDecimals = cfg.yAxisDecimals !== undefined ? cfg.yAxisDecimals : 2;
    const useThousandSeparator = cfg.useThousandSeparator !== false; // default true

    // Calculate Y scale
    let minValue, maxValue;
    const startAtZero = cfg.yAxisStartAtZero !== false; // default true
    if (cfg.renderType === 'high-low') {
      minValue = Math.min(...aggregatedData.map(d => d.lowValue));
      maxValue = Math.max(...aggregatedData.map(d => d.highValue));
    } else {
      minValue = startAtZero ? 0 : Math.min(...aggregatedData.map(d => d.value));
      maxValue = Math.max(...aggregatedData.map(d => d.value));
    }

    // For log scale, ensure minValue is positive
    const tickCount = 5;
    let tickValues = [];
    
    if (useLogScale) {
      minValue = Math.max(1, minValue); // Log scale needs positive values
      // Ensure maxValue is greater than minValue
      if (maxValue <= minValue) maxValue = minValue * 10;
      
      // Generate log scale ticks at nice powers of 10
      // Find the decade range - use floor for min and ceil for max to cover full range
      const minDecade = Math.floor(Math.log10(minValue));
      const maxDecade = Math.ceil(Math.log10(maxValue));
      const decadeRange = maxDecade - minDecade;
      
      // Determine step in decades to get approximately tickCount ticks
      let decadeStep = Math.max(1, Math.ceil(decadeRange / tickCount));
      
      // Generate ticks at powers of 10 - always include min and max decades
      tickValues = [];
      for (let decade = minDecade; decade <= maxDecade; decade += decadeStep) {
        tickValues.push(Math.pow(10, decade));
      }
      
      // Ensure we include the max decade if step skipped it
      const maxDecadeValue = Math.pow(10, maxDecade);
      if (tickValues[tickValues.length - 1] < maxDecadeValue) {
        tickValues.push(maxDecadeValue);
      }
      
      // If we have too few ticks, add intermediate values (2x and 5x)
      if (tickValues.length < 3 && decadeRange >= 1) {
        const newTicks = [];
        for (let decade = minDecade; decade <= maxDecade; decade++) {
          const base = Math.pow(10, decade);
          [1, 2, 5].forEach(mult => {
            const value = base * mult;
            if (value >= Math.pow(10, minDecade) && value <= Math.pow(10, maxDecade)) {
              newTicks.push(value);
            }
          });
        }
        // Select evenly spaced ticks
        if (newTicks.length > tickCount + 1) {
          tickValues = [];
          for (let i = 0; i <= tickCount; i++) {
            const idx = Math.round(i * (newTicks.length - 1) / tickCount);
            tickValues.push(newTicks[idx]);
          }
        } else {
          tickValues = newTicks;
        }
      }
      
      // Ensure we have at least min and max decade powers
      if (tickValues.length === 0) {
        tickValues = [Math.pow(10, minDecade), Math.pow(10, maxDecade)];
      }
      
      // Update minValue/maxValue to match actual tick range (powers of 10)
      minValue = Math.min(...tickValues);
      maxValue = Math.max(...tickValues);
    } else {
      // Linear scale: calculate nice step and adjust max
      const rawRange = maxValue - minValue;
      const rawStep = rawRange / tickCount;
      const niceStep = niceNumberCeil(rawStep);
      
      // Adjust minValue down to nice number if not 0
      if (minValue !== 0) {
        minValue = Math.floor(minValue / niceStep) * niceStep;
      }
      
      // Adjust maxValue up to be minValue + (tickCount * niceStep)
      maxValue = minValue + (tickCount * niceStep);
      
      // Generate ticks using nice step
      for (let i = 0; i <= tickCount; i++) {
        tickValues.push(minValue + niceStep * i);
      }
    }

    // Y scale function (uses final minValue/maxValue)
    const yScale = (value) => {
      if (useLogScale) {
        // Log10 scale: map log(value) to pixel position
        const safeValue = Math.max(minValue, value); // Clamp to minValue
        const logMin = Math.log10(minValue);
        const logMax = Math.log10(maxValue);
        const logValue = Math.log10(safeValue);
        return innerHeight - ((logValue - logMin) / (logMax - logMin)) * innerHeight;
      } else {
        // Linear scale
        return innerHeight - ((value - minValue) / (maxValue - minValue)) * innerHeight;
      }
    };

    // Create Y-axis SVG (sticky)
    const yAxisSvg = createSVGElement('svg', {
      width: margin.left,
      height: innerHeight + margin.top + margin.bottom,
      class: 'barchart-yaxis'
    });

    const yAxisGroup = createSVGElement('g', {
      transform: `translate(${margin.left - 1}, ${margin.top})`
    });
    yAxisSvg.appendChild(yAxisGroup);

    // Y axis line
    yAxisGroup.appendChild(createSVGElement('line', {
      x1: 0, y1: 0, x2: 0, y2: innerHeight,
      class: 'axis-line'
    }));

    // Render ticks (from top to bottom, so reverse the order)
    // tickValues was already generated above
    const actualTickCount = tickValues.length - 1;
    [...tickValues].reverse().forEach((value, i) => {
      // For log scale, use yScale to get correct position; for linear, use even spacing
      const y = useLogScale ? yScale(value) : (innerHeight / actualTickCount) * i;

      yAxisGroup.appendChild(createSVGElement('line', {
        x1: -5, y1: y, x2: 0, y2: y,
        class: 'axis-tick'
      }));

      const label = createSVGElement('text', {
        x: -10, y: y + 4,
        class: 'axis-label',
        'text-anchor': 'end'
      });
      label.textContent = formatNumber(value, numberFormat, numberDecimals, useThousandSeparator);
      yAxisGroup.appendChild(label);
    });
    
    // For log scale, add minor tick marks on y-axis
    // Number of intermediates depends on position: bottom sections get more, top sections get fewer
    if (useLogScale && tickValues.length > 1) {
      // tickValues is already reversed (high to low), use original order (low to high)
      const sortedTicks = [...tickValues].sort((a, b) => a - b);
      const numIntervals = sortedTicks.length - 1;
      
      // Calculate max intermediates based on position (0 = bottom, numIntervals-1 = top)
      // Bottom gets max 4 lines, top gets 0 lines, interpolate in between
      function getMaxIntermediatesForPosition(position) {
        // position 0 = bottom (most lines), position numIntervals-1 = top (no lines)
        const ratio = position / Math.max(1, numIntervals - 1);
        return Math.round(4 * (1 - ratio)); // 4 at bottom, 0 at top
      }
      
      // For each interval between ticks, collect all possible intermediates and limit to max
      for (let i = 0; i < sortedTicks.length - 1; i++) {
        const lowerTick = sortedTicks[i];
        const upperTick = sortedTicks[i + 1];
        const maxCount = getMaxIntermediatesForPosition(i);
        
        if (maxCount === 0) continue;
        
        // Collect all possible intermediate values across all decades in this interval
        const allIntermediates = [];
        const lowerDecade = Math.floor(Math.log10(lowerTick));
        const upperDecade = Math.floor(Math.log10(upperTick));
        const multipliers = [2, 3, 4, 5, 6, 7, 8, 9];
        
        for (let decade = lowerDecade; decade <= upperDecade; decade++) {
          const baseValue = Math.pow(10, decade);
          multipliers.forEach(mult => {
            const value = baseValue * mult;
            if (value > lowerTick && value < upperTick && value > minValue && value < maxValue) {
              allIntermediates.push(value);
            }
          });
        }
        
        // Select evenly spaced values up to maxCount
        let selectedValues = allIntermediates;
        if (allIntermediates.length > maxCount) {
          selectedValues = [];
          for (let j = 0; j < maxCount; j++) {
            const idx = Math.round(j * (allIntermediates.length - 1) / (maxCount - 1));
            selectedValues.push(allIntermediates[idx]);
          }
        }
        
        // Filter out values too close to major ticks (within 5% of interval in pixels)
        const minDistance = innerHeight * 0.02; // 2% of chart height
        const majorTickYs = sortedTicks.map(t => yScale(t));
        selectedValues = selectedValues.filter(value => {
          const y = yScale(value);
          return majorTickYs.every(tickY => Math.abs(y - tickY) > minDistance);
        });
        
        // Draw the selected intermediate ticks
        selectedValues.forEach(value => {
          const y = yScale(value);
          // Shorter tick for minor values (only 3px instead of 5px)
          yAxisGroup.appendChild(createSVGElement('line', {
            x1: -3, y1: y, x2: 0, y2: y,
            class: 'axis-tick axis-tick-minor'
          }));
        });
      }
    }

    // Y axis label
    if (cfg.yAxisLabel) {
      const yLabel = createSVGElement('text', {
        transform: 'rotate(-90)',
        x: -innerHeight / 2 - margin.top,
        y: 15,
        class: 'axis-title',
        'text-anchor': 'middle'
      });
      yLabel.textContent = cfg.yAxisLabel;
      yAxisSvg.appendChild(yLabel);
    }

    // Create chart SVG (scrollable)
    // Use minimal gap (5px) between y-axis and chart area
    const chartGap = 5;
    const chartSvg = createSVGElement('svg', {
      width: innerWidth + chartGap + margin.right,
      height: innerHeight + margin.top + margin.bottom,
      class: 'barchart-chart'
    });

    const chartGroup = createSVGElement('g', {
      transform: `translate(${chartGap}, ${margin.top})`
    });
    chartSvg.appendChild(chartGroup);

    // Draw grid
    if (cfg.showGrid) {
      const gridGroup = createSVGElement('g', { class: 'grid' });
      
      // Draw main grid lines at tick positions
      tickValues.forEach((value, i) => {
        const y = useLogScale ? yScale(value) : (innerHeight / actualTickCount) * i;
        gridGroup.appendChild(createSVGElement('line', {
          x1: 0, y1: y, x2: innerWidth, y2: y,
          class: 'grid-line'
        }));
      });
      
      // For log scale, draw intermediate grid lines between major ticks
      // Number of intermediates depends on position: bottom sections get more, top sections get fewer
      if (useLogScale && tickValues.length > 1) {
        // tickValues is already reversed (high to low), use original order (low to high)
        const sortedTicks = [...tickValues].sort((a, b) => a - b);
        const numIntervals = sortedTicks.length - 1;
        
        // Calculate max intermediates based on position (0 = bottom, numIntervals-1 = top)
        // Bottom gets max 4 lines, top gets 0 lines, interpolate in between
        function getMaxIntermediatesForPosition(position) {
          // position 0 = bottom (most lines), position numIntervals-1 = top (no lines)
          const ratio = position / Math.max(1, numIntervals - 1);
          return Math.round(4 * (1 - ratio)); // 4 at bottom, 0 at top
        }
        
        // For each interval between ticks, collect all possible intermediates and limit to max
        for (let i = 0; i < sortedTicks.length - 1; i++) {
          const lowerTick = sortedTicks[i];
          const upperTick = sortedTicks[i + 1];
          const maxCount = getMaxIntermediatesForPosition(i);
          
          if (maxCount === 0) continue;
          
          // Collect all possible intermediate values across all decades in this interval
          const allIntermediates = [];
          const lowerDecade = Math.floor(Math.log10(lowerTick));
          const upperDecade = Math.floor(Math.log10(upperTick));
          const multipliers = [2, 3, 4, 5, 6, 7, 8, 9];
          
          for (let decade = lowerDecade; decade <= upperDecade; decade++) {
            const baseValue = Math.pow(10, decade);
            multipliers.forEach(mult => {
              const value = baseValue * mult;
              if (value > lowerTick && value < upperTick && value > minValue && value < maxValue) {
                allIntermediates.push(value);
              }
            });
          }
          
          // Select evenly spaced values up to maxCount
          let selectedValues = allIntermediates;
          if (allIntermediates.length > maxCount) {
            selectedValues = [];
            for (let j = 0; j < maxCount; j++) {
              const idx = Math.round(j * (allIntermediates.length - 1) / (maxCount - 1));
              selectedValues.push(allIntermediates[idx]);
            }
          }
          
          // Filter out values too close to major ticks (within 2% of chart height)
          const minDistance = innerHeight * 0.02;
          const majorTickYs = sortedTicks.map(t => yScale(t));
          selectedValues = selectedValues.filter(value => {
            const y = yScale(value);
            return majorTickYs.every(tickY => Math.abs(y - tickY) > minDistance);
          });
          
          // Draw the selected intermediate grid lines
          selectedValues.forEach(value => {
            const y = yScale(value);
            gridGroup.appendChild(createSVGElement('line', {
              x1: 0, y1: y, x2: innerWidth, y2: y,
              class: 'grid-line grid-line-minor'
            }));
          });
        }
      }
      
      chartGroup.appendChild(gridGroup);
    }

    // Draw bars
    const barsGroup = createSVGElement('g', { class: 'bars' });

    aggregatedData.forEach((d, i) => {
      const x = i * barStep + (barStep - barWidth) / 2;

      if (cfg.renderType === 'high-low') {
        const barGroup = createSVGElement('g', { class: 'high-low-bar' });

        const yHigh = yScale(d.highValue);
        const yLow = yScale(d.lowValue);
        
        // Use minimal height (2px) when high/low are equal (zero-height bar)
        const barHeight = yLow - yHigh;
        const minBarHeight = 2;
        const actualHeight = Math.max(minBarHeight, barHeight);
        const actualY = barHeight < minBarHeight ? yHigh - (minBarHeight - barHeight) / 2 : yHigh;
        

        const avgY = yScale(d.value);
        // If bar is minimal height, draw the avg marker line first (behind the bar), else draw it after
        if (actualHeight === minBarHeight) {
          barGroup.appendChild(createSVGElement('line', {
            x1: x - 2, y1: avgY,
            x2: x + barWidth + 2, y2: avgY,
            class: 'avg-marker',
            stroke: cfg.avgMarkerColor || '#ff6b6b',
            'stroke-width': 3
          }));
        }
        barGroup.appendChild(createSVGElement('rect', {
          x: x, y: actualY,
          width: barWidth,
          height: actualHeight,
          class: 'bar high-low',
          fill: cfg.highLowColor || '#2c5aa0'
        }));
        if (actualHeight !== minBarHeight) {
          barGroup.appendChild(createSVGElement('line', {
            x1: x - 2, y1: avgY,
            x2: x + barWidth + 2, y2: avgY,
            class: 'avg-marker',
            stroke: cfg.avgMarkerColor || '#ff6b6b',
            'stroke-width': 3
          }));
        }

        if (tooltip) {
          barGroup.addEventListener('mouseenter', (e) => {
            // Use custom formatter if provided, otherwise use default
            if (cfg.tooltipFormatter && typeof cfg.tooltipFormatter === 'function') {
              tooltip.innerHTML = cfg.tooltipFormatter(d, cfg);
            } else {
              tooltip.innerHTML = `<strong>${d.date}</strong><br>High: ${d.highValue}<br>Low: ${d.lowValue}<br>Avg: ${d.value}`;
            }
            tooltip.style.display = 'block';
            positionTooltip(tooltip, e);
          });
          barGroup.addEventListener('mousemove', (e) => {
            positionTooltip(tooltip, e);
          });
          barGroup.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
          });
        }

        barsGroup.appendChild(barGroup);
      } else {
        const barHeight = Math.max(1, innerHeight - yScale(d.value));
        const bar = createSVGElement('rect', {
          x: x, y: yScale(d.value),
          width: barWidth,
          height: barHeight,
          class: 'bar',
          fill: cfg.barColor || '#4a90d9'
        });

        if (tooltip) {
          bar.addEventListener('mouseenter', (e) => {
            // Use custom formatter if provided, otherwise use default
            if (cfg.tooltipFormatter && typeof cfg.tooltipFormatter === 'function') {
              tooltip.innerHTML = cfg.tooltipFormatter(d, cfg);
            } else {
              tooltip.innerHTML = `<strong>${d.date}</strong><br>Value: ${d.value}`;
            }
            tooltip.style.display = 'block';
            positionTooltip(tooltip, e);
          });
          bar.addEventListener('mousemove', (e) => {
            positionTooltip(tooltip, e);
          });
          bar.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
          });
        }

        barsGroup.appendChild(bar);
      }
    });

    chartGroup.appendChild(barsGroup);

    // Create hover indicator elements (vertical line + circle) - initially hidden
    const hoverIndicatorGroup = createSVGElement('g', { class: 'hover-indicator', style: 'display: none;' });
    
    // Vertical line from top to bottom
    const hoverLine = createSVGElement('line', {
      x1: 0, y1: 0,
      x2: 0, y2: innerHeight,
      class: 'hover-line'
    });
    hoverIndicatorGroup.appendChild(hoverLine);
    
    // Circle at the top of the bar
    const hoverCircle = createSVGElement('circle', {
      cx: 0, cy: 0, r: 5,
      class: 'hover-circle'
    });
    hoverIndicatorGroup.appendChild(hoverCircle);
    
    chartGroup.appendChild(hoverIndicatorGroup);

    // Add invisible hover zones for each bar (full height for vertical hover tooltip)
    if (tooltip) {
      const hoverZonesGroup = createSVGElement('g', { class: 'hover-zones' });
      
      aggregatedData.forEach((d, i) => {
        const x = i * barStep;
        const barCenterX = x + barStep / 2;
        
        // Calculate the y position for the circle (top of bar in normal mode, average value in high-low mode)
        let barTopY;
        if (cfg.renderType === 'high-low') {
          // In high-low mode, show circle at the average value marker position
          barTopY = yScale(d.value);
        } else {
          barTopY = yScale(d.value);
        }
        
        // Create an invisible rect that spans the full height of the chart
        const hoverZone = createSVGElement('rect', {
          x: x,
          y: 0,
          width: barStep,
          height: innerHeight,
          class: 'hover-zone',
          fill: 'transparent',
          'pointer-events': 'all'
        });
        
        hoverZone.addEventListener('mouseenter', (e) => {
          // Show hover indicator
          hoverIndicatorGroup.style.display = 'block';
          hoverLine.setAttribute('x1', barCenterX);
          hoverLine.setAttribute('x2', barCenterX);
          hoverCircle.setAttribute('cx', barCenterX);
          hoverCircle.setAttribute('cy', barTopY);
          
          // Use custom formatter if provided, otherwise use default
          if (cfg.tooltipFormatter && typeof cfg.tooltipFormatter === 'function') {
            tooltip.innerHTML = cfg.tooltipFormatter(d, cfg);
          } else if (cfg.renderType === 'high-low') {
            tooltip.innerHTML = `<strong>${d.date}</strong><br>High: ${d.highValue}<br>Low: ${d.lowValue}<br>Avg: ${d.value}`;
          } else {
            tooltip.innerHTML = `<strong>${d.date}</strong><br>Value: ${d.value}`;
          }
          tooltip.style.display = 'block';
          positionTooltip(tooltip, e);
        });
        
        hoverZone.addEventListener('mousemove', (e) => {
          positionTooltip(tooltip, e);
        });
        
        hoverZone.addEventListener('mouseleave', () => {
          // Hide hover indicator
          hoverIndicatorGroup.style.display = 'none';
          tooltip.style.display = 'none';
        });
        
        hoverZonesGroup.appendChild(hoverZone);
      });
      
      chartGroup.appendChild(hoverZonesGroup);
    }

    // Title will be rendered as HTML overlay for sticky positioning
    // Store title in config for later use
    const titleText = cfg.title || null;

    return { yAxisSvg, chartSvg, innerHeight, titleText };
  }

  // ============================================================================
  // X-AXIS RENDERER
  // ============================================================================

  /**
   * Get quarter number (1-4) for a given month (0-11)
   * @param {number} month - Month (0-11)
   * @returns {number} Quarter (1-4)
   */
  function getQuarter(month) {
    return Math.floor(month / 3) + 1;
  }

  /**
   * Get quarter from week number (approximate)
   * @param {number} weekNum - Week number (1-53)
   * @returns {number} Quarter (1-4)
   */
  function getQuarterFromWeek(weekNum) {
    if (weekNum <= 13) return 1;
    if (weekNum <= 26) return 2;
    if (weekNum <= 39) return 3;
    return 4;
  }

  function renderXAxis(cfg, aggregatedData, barStep, innerWidth, margin) {
    // Increase height for week mode to fit week labels (row 1) + year/quarter labels (row 2)
    const xAxisHeight = cfg.chartType === 'byWeek' ? 55 : 60;
    const chartGap = 5;

    // Empty y-axis spacer
    const xAxisYSpacer = createSVGElement('svg', {
      width: margin.left,
      height: xAxisHeight,
      class: 'barchart-xaxis-spacer'
    });

    // X-axis SVG (scrollable with chart)
    const xAxisSvg = createSVGElement('svg', {
      width: innerWidth + chartGap + margin.right,
      height: xAxisHeight,
      class: 'barchart-xaxis'
    });

    const xAxisGroup = createSVGElement('g', { transform: `translate(${chartGap}, 0)` });
    xAxisSvg.appendChild(xAxisGroup);

    // X axis line
    xAxisGroup.appendChild(createSVGElement('line', {
      x1: 0, y1: 0, x2: innerWidth, y2: 0,
      class: 'axis-line'
    }));

    // X axis labels with intelligent thinning
    const maxLabels = Math.floor(innerWidth / 50);
    const labelStep = Math.max(1, Math.ceil(aggregatedData.length / maxLabels));
    const processedYears = new Set();

    aggregatedData.forEach((d, i) => {
      const x = i * barStep + barStep / 2;

      // Tick mark
      xAxisGroup.appendChild(createSVGElement('line', {
        x1: x, y1: 0, x2: x, y2: 5,
        class: 'axis-tick'
      }));

      // Label (with thinning)
      if (i % labelStep === 0) {
        let labelText = d.date;

        if (cfg.chartType === 'byWeekday') {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          labelText = days[parseInt(d.date)];
        } else if (cfg.chartType === 'byMonth') {
          const [year, month] = d.date.split('-');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          labelText = monthNames[parseInt(month) - 1];

          if (!processedYears.has(year)) {
            processedYears.add(year);
            const yearLabel = createSVGElement('text', {
              x: x, y: 35,
              class: 'year-label',
              'text-anchor': 'middle'
            });
            yearLabel.textContent = year;
            xAxisGroup.appendChild(yearLabel);
          }
        } else if (cfg.chartType === 'byWeek') {
          const [year, week] = d.date.split('-W');
          labelText = `W${week}`;
          // Year and quarter labels are rendered separately below
        } else if (cfg.chartType === 'byDay') {
          // Show abbreviated date
          const parts = d.date.split('-');
          labelText = `${parts[1]}/${parts[2]}`;
          
          // Show year on first label of each year
          const year = parts[0];
          if (!processedYears.has(year)) {
            processedYears.add(year);
            const yearLabel = createSVGElement('text', {
              x: x, y: 35,
              class: 'year-label',
              'text-anchor': 'middle'
            });
            yearLabel.textContent = year;
            xAxisGroup.appendChild(yearLabel);
          }
        }

        const label = createSVGElement('text', {
          x: x, y: 20,
          class: 'axis-label',
          'text-anchor': 'middle'
        });
        label.textContent = labelText;
        xAxisGroup.appendChild(label);
      }
    });

    // For byWeek mode: render year and quarter labels on the second row
    if (cfg.chartType === 'byWeek') {
      const processedQuarters = new Set();
      let lastYear = null;
      let yearStartIdx = 0;

      aggregatedData.forEach((d, i) => {
        const x = i * barStep + barStep / 2;
        const [year, weekStr] = d.date.split('-W');
        const weekNum = parseInt(weekStr);
        const quarter = getQuarterFromWeek(weekNum);
        const quarterKey = `${year}-Q${quarter}`;

        // Track year boundaries
        if (lastYear !== year) {
          // Place year label for previous year
          if (lastYear !== null) {
            const prevEndX = (i - 1) * barStep + barStep / 2;
            const yearLabelX = (yearStartIdx * barStep + barStep / 2 + prevEndX) / 2;
            const yearLabel = createSVGElement('text', {
              x: yearLabelX, y: 45,
              class: 'year-label',
              'text-anchor': 'middle'
            });
            yearLabel.textContent = lastYear;
            xAxisGroup.appendChild(yearLabel);

            // Draw year boundary line
            const boundaryX = i * barStep;
            xAxisGroup.appendChild(createSVGElement('line', {
              x1: boundaryX, y1: 0,
              x2: boundaryX, y2: xAxisHeight,
              class: 'axis-line',
              'stroke-width': '1'
            }));
          }
          yearStartIdx = i;
          lastYear = year;
        }

        // Place quarter label at the first occurrence of each quarter
        if (!processedQuarters.has(quarterKey)) {
          processedQuarters.add(quarterKey);

          // Find the extent of this quarter for label placement
          let quarterEndIdx = i;
          for (let j = i + 1; j < aggregatedData.length; j++) {
            const [y2, w2] = aggregatedData[j].date.split('-W');
            if (y2 !== year || getQuarterFromWeek(parseInt(w2)) !== quarter) break;
            quarterEndIdx = j;
          }
          const quarterStartX = x;
          const quarterEndX = quarterEndIdx * barStep + barStep / 2;
          const quarterLabelX = (quarterStartX + quarterEndX) / 2;

          const quarterLabel = createSVGElement('text', {
            x: quarterLabelX, y: 35,
            class: 'week-label',
            'text-anchor': 'middle'
          });
          quarterLabel.textContent = `Q${quarter}`;
          xAxisGroup.appendChild(quarterLabel);

          // Draw a subtle vertical line at quarter boundary (except at start of data or year)
          if (i > 0 && aggregatedData[i - 1].date.split('-W')[0] === year) {
            const boundaryX = i * barStep;
            xAxisGroup.appendChild(createSVGElement('line', {
              x1: boundaryX, y1: 0,
              x2: boundaryX, y2: xAxisHeight - 10,
              class: 'axis-tick',
              'stroke-dasharray': '2,2',
              'stroke-opacity': '0.4'
            }));
          }
        }
      });

      // Place the last year label
      if (lastYear !== null) {
        const lastX = (aggregatedData.length - 1) * barStep + barStep / 2;
        const yearLabelX = (yearStartIdx * barStep + barStep / 2 + lastX) / 2;
        const yearLabel = createSVGElement('text', {
          x: yearLabelX, y: 45,
          class: 'year-label',
          'text-anchor': 'middle'
        });
        yearLabel.textContent = lastYear;
        xAxisGroup.appendChild(yearLabel);
      }
    }

    return { xAxisYSpacer, xAxisSvg };
  }

  // ============================================================================
  // MULTI-CHART FUNCTION
  // ============================================================================

  /**
   * Create multiple charts with shared x-axis
   * @param {Object} config - Configuration object
   * @returns {HTMLElement} The chart container element
   */
  function createMultiChart(config) {
    const defaults = {
      container: null,
      data: [],
      charts: [],          // Array of chart configs: [{ renderType, yAxisLabel, barColor, ... }, ...]
      chartType: 'byDay',  // Shared x-axis grouping
      visibleWidth: 800,   // Visible width (scrollable if content exceeds)
      chartHeight: 200,    // Height per chart
      margin: { top: 30, right: 10, bottom: 10, left: 70 },
      barMinWidth: 8,      // Minimum bar width
      showTooltip: true,
      showGrid: true,
      tooltipFormatter: null, // Custom tooltip formatter function: (data, chartConfig) => string|HTMLstring
      scrollToEnd: false // Scroll initially to the rightmost bar
    };

    const cfg = { ...defaults, ...config };

    // Normalize data
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

    // Aggregate data
    let aggregatedData;
    if (cfg.chartType !== 'byDay') {
      aggregatedData = aggregates(data, cfg.chartType);
    } else {
      aggregatedData = data.map(d => ({
        date: d.date.toISOString().split('T')[0],
        value: d.value,
        highValue: d.highValue || d.value,
        lowValue: d.lowValue || d.value,
        count: 1
      }));
    }

    // Calculate dimensions
    const barCount = aggregatedData.length;
    const barPadding = 0.2;
    const minContentWidth = barCount * cfg.barMinWidth / (1 - barPadding);
    const innerWidth = Math.max(cfg.visibleWidth - cfg.margin.left - cfg.margin.right, minContentWidth);
    const barStep = innerWidth / barCount;
    const barWidth = Math.max(1, barStep * (1 - barPadding));

    // Create tooltip
    let tooltip = null;
    if (cfg.showTooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'chart-tooltip';
      tooltip.style.display = 'none';
      document.body.appendChild(tooltip);
    }

    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'barchart-container';
    mainContainer.style.width = cfg.visibleWidth + 'px';

    // Create rows for each chart
    cfg.charts.forEach((chartCfg, index) => {
      const row = document.createElement('div');
      row.className = 'barchart-row';

      // Merge config
      const panelCfg = {
        ...cfg,
        ...chartCfg,
        innerWidth,
        innerHeight: cfg.chartHeight,
        margin: cfg.margin
      };

      // Re-aggregate if different renderType needs it
      let panelData = aggregatedData;
      if (chartCfg.renderType === 'high-low' && cfg.chartType === 'byDay') {
        // For high-low with byDay, we need the aggregated high/low values
        panelData = aggregatedData;
      }

      const { yAxisSvg, chartSvg, titleText } = renderChartPanel(panelCfg, panelData, barStep, barWidth, tooltip);

      // Y-axis container (sticky)
      const yAxisContainer = document.createElement('div');
      yAxisContainer.className = 'barchart-yaxis-container';
      yAxisContainer.appendChild(yAxisSvg);
      row.appendChild(yAxisContainer);

      // Chart area wrapper with title overlay
      const chartAreaWrapper = document.createElement('div');
      chartAreaWrapper.className = 'barchart-chart-area';
      chartAreaWrapper.style.width = (cfg.visibleWidth - cfg.margin.left) + 'px';
      chartAreaWrapper.style.position = 'relative';
      
      // Add sticky centered title overlay if title exists (positioned above scroll container)
      if (titleText) {
        const titleOverlay = document.createElement('div');
        titleOverlay.className = 'barchart-title-overlay';
        titleOverlay.textContent = titleText;
        chartAreaWrapper.appendChild(titleOverlay);
      }
      
      // Chart scroll container
      const chartScrollContainer = document.createElement('div');
      chartScrollContainer.className = 'barchart-scroll-container';
      chartScrollContainer.appendChild(chartSvg);
      chartAreaWrapper.appendChild(chartScrollContainer);
      
      row.appendChild(chartAreaWrapper);

      mainContainer.appendChild(row);

      // Store scroll container reference for sync
      row._scrollContainer = chartScrollContainer;
    });

    // Add shared x-axis row
    const xAxisRow = document.createElement('div');
    xAxisRow.className = 'barchart-row barchart-xaxis-row';

    const { xAxisYSpacer, xAxisSvg } = renderXAxis(cfg, aggregatedData, barStep, innerWidth, cfg.margin);

    const xAxisSpacerContainer = document.createElement('div');
    xAxisSpacerContainer.className = 'barchart-yaxis-container';
    xAxisSpacerContainer.appendChild(xAxisYSpacer);
    xAxisRow.appendChild(xAxisSpacerContainer);

    // X-axis area wrapper (for consistent layout with chart rows)
    const xAxisAreaWrapper = document.createElement('div');
    xAxisAreaWrapper.className = 'barchart-chart-area';
    xAxisAreaWrapper.style.width = (cfg.visibleWidth - cfg.margin.left) + 'px';
    
    const xAxisScrollContainer = document.createElement('div');
    xAxisScrollContainer.className = 'barchart-scroll-container barchart-xaxis-scroll';
    xAxisScrollContainer.appendChild(xAxisSvg);
    xAxisAreaWrapper.appendChild(xAxisScrollContainer);
    
    xAxisRow.appendChild(xAxisAreaWrapper);

    mainContainer.appendChild(xAxisRow);
    xAxisRow._scrollContainer = xAxisScrollContainer;

    // Sync scrolling across all charts and x-axis
    // Use a lock that persists briefly to prevent feedback loops causing "bouncing"
    const allScrollContainers = Array.from(mainContainer.querySelectorAll('.barchart-scroll-container'));
    const allYAxisContainers = Array.from(mainContainer.querySelectorAll('.barchart-yaxis-container'));
    const allChartAreas = Array.from(mainContainer.querySelectorAll('.barchart-chart-area'));
    let syncLock = false;
    let syncTimeout = null;
    
    // Check if content needs scrolling and toggle shadow accordingly
    // Also update shadow sides based on scroll position
    function updateShadowVisibility() {
      const firstContainer = allScrollContainers[0];
      if (!firstContainer) return;
      
      const needsScroll = firstContainer.scrollWidth > firstContainer.clientWidth;
      const scrollLeft = firstContainer.scrollLeft;
      const maxScroll = firstContainer.scrollWidth - firstContainer.clientWidth;
      
      // Determine which shadows to show based on scroll position
      const canScrollRight = scrollLeft < maxScroll - 1;
      const canScrollLeft = scrollLeft > 1;
      
      // Y-axis shadow: only show when scrolled (content to the left)
      allYAxisContainers.forEach(yAxisContainer => {
        if (!needsScroll || !canScrollLeft) {
          yAxisContainer.classList.add('no-shadow');
        } else {
          yAxisContainer.classList.remove('no-shadow');
        }
      });
      
      // Chart area right shadow: show when can scroll right
      allChartAreas.forEach(chartArea => {
        if (needsScroll && canScrollRight) {
          chartArea.classList.add('shadow-right');
        } else {
          chartArea.classList.remove('shadow-right');
        }
      });
    }
    
    // Initial check and on resize
    updateShadowVisibility();
    window.addEventListener('resize', updateShadowVisibility);
    
    allScrollContainers.forEach(container => {
      container.addEventListener('scroll', (e) => {
        // If sync lock is active, this is a programmatic scroll - ignore it
        if (syncLock) return;
        
        // Acquire lock to prevent feedback
        syncLock = true;
        
        const scrollLeft = e.target.scrollLeft;
        
        // Sync all other containers
        allScrollContainers.forEach(other => {
          if (other !== e.target) {
            other.scrollLeft = scrollLeft;
          }
        });
        
        // Release lock after scroll events have settled (use a short timeout)
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
          syncLock = false;
        }, 50);
        
        // Update shadow visibility based on scroll position
        updateShadowVisibility();
      }, { passive: true });
    });
    
    // Scroll to end if configured
    if (cfg.scrollToEnd) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        allScrollContainers.forEach(container => {
          container.scrollLeft = container.scrollWidth - container.clientWidth;
        });
        updateShadowVisibility();
      });
    }

    // Append to container if provided
    if (cfg.container) {
      const container = typeof cfg.container === 'string'
        ? document.querySelector(cfg.container)
        : cfg.container;
      if (container) {
        container.appendChild(mainContainer);
      }
    }

    return mainContainer;
  }

  // ============================================================================
  // SINGLE CHART FUNCTION (Wrapper for backwards compatibility)
  // ============================================================================

  /**
   * Create a single barchart (uses multi-chart internally for consistency)
   * @param {Object} config - Configuration object
   * @returns {HTMLElement} The chart container element
   */
  function createBarchart(config) {
    const defaults = {
      container: null,
      data: [],
      chartType: 'byDay',
      renderType: 'bar',
      width: 800,
      height: 400,
      margin: { top: 40, right: 10, bottom: 10, left: 70 },
      barColor: '#4a90d9',
      highLowColor: '#2c5aa0',
      avgMarkerColor: '#ff6b6b',
      showTooltip: true,
      showGrid: true,
      title: '',
      yAxisLabel: '',
      xAxisLabel: '',
      barMinWidth: 8,
      yAxisScale: 'linear',   // 'linear' or 'log10'
      yAxisFormat: 'auto',    // 'auto', 'K', 'M', 'B', or 'none'
      yAxisDecimals: 2,       // Number of decimal places for formatted numbers
      useThousandSeparator: true, // Whether to format numbers with thousand separators
      yAxisStartAtZero: true, // Whether y-axis starts at 0 (true) or at min data value (false)
      tooltipFormatter: null, // Custom tooltip formatter: (data, config) => string|HTML
      scrollToEnd: false      // Scroll initially to the rightmost bar
    };

    const cfg = { ...defaults, ...config };

    // Use multi-chart with single chart config
    return createMultiChart({
      container: cfg.container,
      data: cfg.data,
      chartType: cfg.chartType,
      visibleWidth: cfg.width,
      chartHeight: cfg.height - cfg.margin.top - cfg.margin.bottom,
      margin: cfg.margin,
      barMinWidth: cfg.barMinWidth,
      showTooltip: cfg.showTooltip,
      showGrid: cfg.showGrid,
      tooltipFormatter: cfg.tooltipFormatter,
      scrollToEnd: cfg.scrollToEnd,
      charts: [{
        renderType: cfg.renderType,
        title: cfg.title,
        yAxisLabel: cfg.yAxisLabel,
        barColor: cfg.barColor,
        highLowColor: cfg.highLowColor,
        avgMarkerColor: cfg.avgMarkerColor,
        yAxisScale: cfg.yAxisScale,
        yAxisFormat: cfg.yAxisFormat,
        yAxisDecimals: cfg.yAxisDecimals,
        useThousandSeparator: cfg.useThousandSeparator,
        yAxisStartAtZero: cfg.yAxisStartAtZero,
        tooltipFormatter: cfg.tooltipFormatter
      }]
    });
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  return {
    createBarchart,
    createMultiChart,
    aggregates,
    formatNumber,
    getWeek,
    getWeekStart,
    getMonthStart,
    getYearStart
  };

}));
