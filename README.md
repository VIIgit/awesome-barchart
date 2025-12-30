# Barchart Library

A modern, mode-driven JavaScript library for creating interactive bar charts with multiple visualization types.

## Features

- **Multiple Chart Types**: Daily, Weekly, Monthly, Weekday, and Yearly aggregation
- **Multi-Chart with Shared X-Axis**: Stack multiple charts vertically, each with its own y-axis
- **Horizontal Scrolling**: Automatically scroll when data exceeds visible width
- **Sticky Y-Axis**: Y-axes stay fixed while scrolling, with subtle drop shadow
- **Render Types**: Standard bars and High-Low range visualization
- **Automatic Data Aggregation**: Converts daily data into grouped summaries
- **Interactive Tooltips**: Hover to see data details
- **Modular JavaScript**: UMD module pattern, no global namespace pollution
- **Pure JavaScript**: No dependencies required
- **Easy Customization**: CSS-based styling

## Quick Start

### 1. Include the Library

```html
<link rel="stylesheet" href="src/styles.css">
<script src="src/barchart.js"></script>
```

### 2. Create a Single Chart

```html
<div id="myChart"></div>

<script>
const data = [
  { date: '2025-01-01', value: 42 },
  { date: '2025-01-02', value: 58 },
  { date: '2025-01-03', value: 35 }
];

Barchart.createChart({
  container: '#myChart',
  chartType: 'byDay',
  timeseries: [{
    data: data,
    renderType: 'bar',
    title: 'My Chart'
  }]
});
</script>
```

### 3. Create Multiple Charts with Shared X-Axis

```html
<div id="multiChart"></div>

<script>
Barchart.createChart({
  container: '#multiChart',
  chartType: 'byDay',
  visibleWidth: 900,
  chartHeight: 180,
  timeseries: [
    {
      data: data,  // Data in first timeseries, inherited by others
      renderType: 'bar',
      title: 'Daily Values',
      yAxisLabel: 'Value',
      barColor: '#4a90d9'
    },
    {
      renderType: 'high-low',
      title: 'Value Range',
      yAxisLabel: 'Range',
      highLowColor: '#e74c3c'
    }
  ]
});
</script>
```

## API Reference

### `Barchart.createChart(config)`

Create a chart with one or more timeseries (panels).

#### Global Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | string/element | null | CSS selector or DOM element |
| `timeseries` | array | [] | **Required.** Array of timeseries configurations (each with its own data) |
| `chartType` | string | 'byDay' | Grouping: 'byDay', 'byWeek', 'byMonth', 'byWeekday', 'byYear' |
| `visibleWidth` / `width` | number | 800 | Visible width in pixels |
| `chartHeight` / `height` | number | 200/400 | Height per chart panel |
| `margin` | object | {...} | Chart margins |
| `barMinWidth` | number | 8 | Minimum bar width (enables scrolling) |
| `showTooltip` | boolean | true | Show tooltips on hover |
| `showGrid` | boolean | true | Show grid lines |


#### Timeseries Options

Each item in the `timeseries` array should have:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `data` | array | [] | **Required.** Data array for this timeseries |
| `renderType` | string | 'bar' | 'bar', 'high-low', 'staggered', or 'stacked' |
| `title` | string | '' | Chart panel title |
| `yAxisLabel` | string | '' | Y-axis label |
| `barColor` | string | '#4a90d9' | Bar fill color |
| `highLowColor` | string | '#2c5aa0' | High-low bar color |
| `avgMarkerColor` | string | '#ff6b6b' | Average marker color |
| `yAxisScale` | string | 'linear' | 'linear' or 'log10' |
| `yAxisFormat` | string | 'none' | 'auto', 'K', 'M', 'B', 'none', or custom |
| `yAxisStartAtZero` | boolean | true | Start y-axis at zero |

**Note:** When multiple timeseries share the same data, only the first timeseries needs `data`. Subsequent timeseries without `data` will inherit from the first timeseries.

#### Synchronized Hover and Tooltips

In multi-timeseries (multi-panel) mode, hovering over a bar in any chart will highlight the corresponding bars and show tooltips across all charts, making it easy to compare values at the same x-axis position.

#### Multi-Level X-Axis Labeling (byDay)

When using `chartType: 'byDay'`, the x-axis displays multi-level labels: day, month, and year. This improves readability for long timeseries.

### `Barchart.aggregates(data, mode)`

Aggregate plain data by the specified mode.

```js
const aggregated = Barchart.aggregates(data, 'byMonth');
// Returns: [{ date: '2025-01', value: avg, highValue: max, lowValue: min, count: n }, ...]
```

## Data Format

### Basic Data

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

| Type | Description |
|------|-------------|
| `byDay` | Individual daily bars, no aggregation |
| `byWeek` | Aggregated by ISO week number |
| `byMonth` | Aggregated by month |
| `byWeekday` | Averaged by day of week (Sun-Sat) |
| `byYear` | Aggregated by year |

## Render Types

| Type | Description |
|------|-------------|
| `bar` | Standard bar chart |
| `high-low` | Range visualization with high, low, and average marker |
| `staggered` | Multiple timeseries as side-by-side bars for each x-position |
| `stacked` | Multiple timeseries stacked vertically for each x-position |

### Staggered/Stacked Charts

For `staggered` and `stacked` render types, each timeseries has its own `{ date, value }` data array:

```js
// Each timeseries has its own data array
const priceData = [
  { date: '2025-01-01', value: 42 },
  { date: '2025-01-02', value: 48 },
  { date: '2025-01-03', value: 35 }
];

const feeData = [
  { date: '2025-01-01', value: 3 },
  { date: '2025-01-02', value: 3 },
  { date: '2025-01-03', value: 2 }
];

const taxData = [
  { date: '2025-01-01', value: 1 },
  { date: '2025-01-02', value: 2 },
  // date 3 missing (will be null in chart)
];

Barchart.createChart({
  container: '#staggered',
  chartType: 'byDay',
  renderType: 'staggered',  // or 'stacked'
  title: 'Price Breakdown',
  yAxisLabel: 'Amount ($)',
  timeseries: [
    { data: priceData, label: 'Price', color: '#4a90d9' },
    { data: feeData, label: 'Fee', color: '#e74c3c' },
    { data: taxData, label: 'Tax', color: '#2ecc71' }
  ]
});
```

**Notes:**
- Each timeseries must have `data`, `label`, and optionally `color`
- The library automatically merges all timeseries by date
- Missing dates in a timeseries are treated as `null` values
- Tooltip shows all timeseries values with their labels and totals

## Horizontal Scrolling

When data exceeds the visible width, the chart automatically enables horizontal scrolling:

- **Y-axes remain sticky** (fixed) while scrolling
- **Subtle drop shadow** separates axes from scrolling content
- **Synchronized scrolling** across all charts in multi-chart mode
- **Scrollbar** appears at the bottom

Configure scrolling behavior with `barMinWidth`:

```js
Barchart.createChart({
  // ...
  visibleWidth: 800,   // Visible width
  barMinWidth: 6,      // Minimum pixels per bar
  // If data has 700 points and barMinWidth=6, content width = 700*6 = 4200px
  // This exceeds 800px, so scrolling is enabled
});
```

## Y-Axis and Advanced Options

These options can be set at the global level or per-timeseries.

| Option                | Type      | Default      | Description |
|-----------------------|-----------|--------------|-------------|
| `yAxisScale`          | string    | `'linear'`   | `'linear'` or `'log10'` for y-axis scaling |
| `yAxisFormat`         | string    | `'none'`     | `'auto'`, `'K'`, `'M'`, `'B'`, `'none'`, or custom (e.g. `'0.0 %'` for percent) |
| `yAxisDecimals`       | number    | `2`          | Number of decimals for y-axis labels |
| `useThousandSeparator`| boolean   | `true`       | Use thousand separators in y-axis labels |
| `yAxisStartAtZero`    | boolean   | `true`       | If true, y-axis starts at 0; if false, starts at min data value |
| `tooltipFormatter`    | function  | `null`       | Custom tooltip HTML formatter `(data, config) => string` |

### Custom Percent Formatting

You can use custom percent formats for the y-axis and tooltips by setting `yAxisFormat` to a pattern like `'0.0 %'`. For example, `'0.0 %'` will display values as percentages with one decimal place.

### Example: Log10 Scale and Custom Y-Axis

```js
Barchart.createChart({
  container: '#logChart',
  chartType: 'byDay',
  showGrid: true,
  timeseries: [{
    data: myData,
    renderType: 'bar',
    yAxisLabel: 'Logarithmic',
    yAxisScale: 'log10',
    yAxisFormat: 'auto',
    yAxisDecimals: 0,
    yAxisStartAtZero: false
  }]
});
```


### Multi-Timeseries Example with Per-Timeseries Data and Types

```js
// Each timeseries has its own data
const barData = [
  { date: '2025-01-01', value: 10 },
  { date: '2025-01-02', value: 20 }
];
const rangeData = [
  { date: '2025-01-01', value: 5, highValue: 8, lowValue: 2 },
  { date: '2025-01-02', value: 7, highValue: 10, lowValue: 4 }
];

Barchart.createChart({
  container: '#multi',
  chartType: 'byDay',
  visibleWidth: 1000,
  chartHeight: 200,
  timeseries: [
    { data: barData, renderType: 'bar', yAxisLabel: 'A', yAxisStartAtZero: true },
    { data: rangeData, renderType: 'high-low', yAxisLabel: 'B', yAxisScale: 'log10', yAxisStartAtZero: false }
  ]
});
```

---


## Examples

- `examples/index.html` - Basic examples of all chart types and render modes
- `examples/multi-chart.html` - Multi-timeseries charts with 700 data points
- `examples/per-chart-data.html` - Multi-timeseries with per-timeseries data and types

## File Structure

```
barchart2/
├── src/
│   ├── barchart.js    # Core library (UMD module)
│   └── styles.css     # Base styles
├── examples/
│   ├── index.html     # Basic examples
│   ├── multi-chart.html # Multi-chart example with 700 data points
│   └── styles.css     # Example-specific styles
├── README.md          # This file
└── .cursorrules       # AI agent guidance
```

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## License

MIT
