# Barchart Library v2

A modern, mode-driven JavaScript library for creating interactive bar charts with multiple visualization types.

## Features

- **Multiple Chart Types**: Daily, Weekly, Monthly, Weekday, and Yearly aggregation
- **Render Types**: Standard bars and High-Low range visualization
- **Automatic Data Aggregation**: Converts daily data into grouped summaries
- **Interactive Tooltips**: Hover to see data details
- **Responsive Design**: Works on all screen sizes
- **Pure JavaScript**: No dependencies required
- **Easy Customization**: CSS-based styling

## Quick Start

### 1. Include the Library

```html
<link rel="stylesheet" href="src/styles.css">
<script src="src/barchart.js"></script>
```

### 2. Create a Chart

```html
<div id="myChart"></div>

<script>
const data = [
  { date: '2025-01-01', value: 42 },
  { date: '2025-01-02', value: 58 },
  { date: '2025-01-03', value: 35 }
];

createBarchart({
  container: '#myChart',
  data: data,
  chartType: 'byDay',
  renderType: 'bar',
  title: 'My Chart'
});
</script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | string/element | null | CSS selector or DOM element |
| `data` | array | [] | Array of data objects |
| `chartType` | string | 'byDay' | Grouping mode: 'byDay', 'byWeek', 'byMonth', 'byWeekday', 'byYear' |
| `renderType` | string | 'bar' | Render mode: 'bar' or 'high-low' |
| `width` | number | 800 | Chart width in pixels |
| `height` | number | 400 | Chart height in pixels |
| `margin` | object | {top: 40, right: 30, bottom: 60, left: 60} | Chart margins |
| `barColor` | string | '#4a90d9' | Bar fill color |
| `highLowColor` | string | '#2c5aa0' | High-low bar color |
| `avgMarkerColor` | string | '#ff6b6b' | Average marker color |
| `showTooltip` | boolean | true | Show tooltips on hover |
| `showGrid` | boolean | true | Show grid lines |
| `title` | string | '' | Chart title |
| `yAxisLabel` | string | '' | Y-axis label |
| `xAxisLabel` | string | '' | X-axis label |

## Data Format

### Basic Data (for bar charts)

```js
const data = [
  { date: '2025-01-01', value: 42 },
  { date: '2025-01-02', value: 58 },
  { date: '2025-01-03', value: 35 }
];
```

### High-Low Data (pre-aggregated)

```js
const data = [
  { date: '2025-01-01', value: 15, highValue: 22, lowValue: 8 },
  { date: '2025-01-02', value: 17, highValue: 24, lowValue: 12 }
];
```

## Chart Types

### byDay
Individual daily bars, no aggregation.

### byWeek
Data aggregated by ISO week number. Multi-level axis shows year and week.

### byMonth
Data aggregated by month. Shows month names with year labels.

### byWeekday
Average values by day of week (Sun-Sat). Great for spotting weekly patterns.

### byYear
Data aggregated by year.

## Render Types

### bar (default)
Standard bar chart showing values.

### high-low
Range visualization showing:
- **Bar**: Extends from low to high value
- **Marker**: Indicates average value

## Data Aggregation Utility

Use the `aggregates()` function to convert plain data into grouped format:

```js
const plainData = [
  { date: '2025-01-01', value: 42 },
  { date: '2025-01-02', value: 58 },
  { date: '2025-01-15', value: 35 }
];

const aggregatedByMonth = aggregates(plainData, 'byMonth');
// Result:
// [
//   { date: '2025-01', value: 45, highValue: 58, lowValue: 35, count: 3 }
// ]
```

### Function Signature

```js
function aggregates(data, mode)
```

- `data`: Array of `{date, value}` objects
- `mode`: One of 'byDay', 'byWeek', 'byMonth', 'byWeekday', 'byYear'
- Returns: Array of `{date, value, highValue, lowValue, count}`

## Examples

See `examples/index.html` for interactive examples of all chart types.

## File Structure

```
barchart2/
├── src/
│   ├── barchart.js    # Core library
│   └── styles.css     # Base styles
├── examples/
│   ├── index.html     # Interactive examples
│   └── styles.css     # Example-specific styles
├── README.md          # This file
└── .cursorrules       # AI agent guidance
```

## Customization

### CSS Styling

Override default styles in your CSS:

```css
/* Custom bar color */
#myChart .bar {
  fill: #27ae60;
}

/* Custom tooltip */
.chart-tooltip {
  background: rgba(0, 0, 0, 0.9);
  border-radius: 8px;
}
```

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## License

MIT
