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

Barchart.createBarchart({
  container: '#myChart',
  data: data,
  chartType: 'byDay',
  renderType: 'bar',
  title: 'My Chart'
});
</script>
```

### 3. Create Multiple Charts with Shared X-Axis

```html
<div id="multiChart"></div>

<script>
Barchart.createMultiChart({
  container: '#multiChart',
  data: data,
  chartType: 'byDay',
  visibleWidth: 900,
  chartHeight: 180,
  charts: [
    {
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

### `Barchart.createBarchart(config)`

Create a single chart.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | string/element | null | CSS selector or DOM element |
| `data` | array | [] | Array of data objects |
| `chartType` | string | 'byDay' | Grouping: 'byDay', 'byWeek', 'byMonth', 'byWeekday', 'byYear' |
| `renderType` | string | 'bar' | 'bar' or 'high-low' |
| `width` | number | 800 | Visible width in pixels |
| `height` | number | 400 | Chart height in pixels |
| `margin` | object | {...} | Chart margins |
| `barColor` | string | '#4a90d9' | Bar fill color |
| `highLowColor` | string | '#2c5aa0' | High-low bar color |
| `avgMarkerColor` | string | '#ff6b6b' | Average marker color |
| `barMinWidth` | number | 8 | Minimum bar width (enables scrolling) |
| `showTooltip` | boolean | true | Show tooltips on hover |
| `showGrid` | boolean | true | Show grid lines |
| `title` | string | '' | Chart title |
| `yAxisLabel` | string | '' | Y-axis label |

### `Barchart.createMultiChart(config)`

Create multiple charts with a shared x-axis.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | string/element | null | CSS selector or DOM element |
| `data` | array | [] | Array of data objects (shared by all charts) |
| `charts` | array | [] | Array of chart configurations |
| `chartType` | string | 'byDay' | Shared x-axis grouping |
| `visibleWidth` | number | 800 | Visible width (scrolls if content exceeds) |
| `chartHeight` | number | 200 | Height per chart |
| `margin` | object | {...} | Shared margins |
| `barMinWidth` | number | 8 | Minimum bar width |
| `showTooltip` | boolean | true | Show tooltips |
| `showGrid` | boolean | true | Show grid lines |

Each chart in the `charts` array can have:

- `renderType`: 'bar' or 'high-low'
- `title`: Chart title
- `yAxisLabel`: Y-axis label
- `barColor`: Bar color (for 'bar' type)
- `highLowColor`: Range bar color (for 'high-low' type)
- `avgMarkerColor`: Average marker color

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

## Horizontal Scrolling

When data exceeds the visible width, the chart automatically enables horizontal scrolling:

- **Y-axes remain sticky** (fixed) while scrolling
- **Subtle drop shadow** separates axes from scrolling content
- **Synchronized scrolling** across all charts in multi-chart mode
- **Scrollbar** appears at the bottom

Configure scrolling behavior with `barMinWidth`:

```js
Barchart.createBarchart({
  // ...
  width: 800,          // Visible width
  barMinWidth: 6,      // Minimum pixels per bar
  // If data has 700 points and barMinWidth=6, content width = 700*6 = 4200px
  // This exceeds 800px, so scrolling is enabled
});
```

## Y-Axis and Advanced Options

| Option                | Type      | Default      | Description |
|-----------------------|-----------|--------------|-------------|
| `yAxisScale`          | string    | `'linear'`   | `'linear'` or `'log10'` for y-axis scaling |
| `yAxisFormat`         | string    | `'auto'`     | `'auto'`, `'K'`, `'M'`, `'B'`, `'none'` (number formatting) |
| `yAxisDecimals`       | number    | `2`          | Number of decimals for y-axis labels |
| `useThousandSeparator`| boolean   | `true`       | Use thousand separators in y-axis labels |
| `yAxisStartAtZero`    | boolean   | `true`       | If true, y-axis starts at 0; if false, starts at min data value |
| `tooltipFormatter`    | function  | `null`       | Custom tooltip HTML formatter `(data, config) => string` |

### Example: Log10 Scale and Custom Y-Axis

```js
Barchart.createBarchart({
  container: '#logChart',
  data: myData,
  yAxisScale: 'log10',
  yAxisLabel: 'Logarithmic',
  yAxisFormat: 'auto',
  yAxisDecimals: 0,
  yAxisStartAtZero: false,
  showGrid: true
});
```

### Multi-Chart Example with Per-Chart Options

```js
Barchart.createMultiChart({
  container: '#multi',
  data: myData,
  charts: [
    { renderType: 'bar', yAxisLabel: 'A', yAxisStartAtZero: true },
    { renderType: 'high-low', yAxisLabel: 'B', yAxisScale: 'log10', yAxisStartAtZero: false }
  ],
  chartType: 'byWeek',
  visibleWidth: 1000,
  chartHeight: 200
});
```

---

## Examples

- `examples/index.html` - Basic examples of all chart types
- `examples/multi-chart.html` - Multi-chart with 700 data points

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
