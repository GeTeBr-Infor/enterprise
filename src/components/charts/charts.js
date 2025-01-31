import { Environment as env } from '../../utils/environment';
import { utils } from '../../utils/utils';
import { xssUtils } from '../../utils/xss';
import { DOM } from '../../utils/dom';
import { theme } from '../theme/theme';

const charts = {};

// Reference to the tooltip
charts.tooltip = {};
charts.isIE = env.browser.name === 'ie';
charts.isIEEdge = env.browser.name === 'edge';

/**
 * Get the current height and widthe of the tooltip.
 * @private
 * @param  {string} content The tooltip content.
 * @returns {object} Object with the height and width.
 */
charts.tooltipSize = function tooltipSize(content) {
  DOM.html(this.tooltip.find('.tooltip-content'), content, '*');
  return { height: this.tooltip.outerHeight(), width: this.tooltip.outerWidth() };
};

/**
 * Format the value based on settings.
 * @private
 * @param  {object} data The data object.
 * @param  {object} settings The sttings to use
 * @returns {string} the formatted string.
 */
charts.formatToSettings = function formatToSettings(data, settings) {
  const d = data.data ? data.data : data;

  if (settings.show === 'value') {
    return settings.formatter ? d3.format(settings.formatter)(d.value) : d.value;
  }

  if (settings.show === 'label') {
    return d.name;
  }

  if (settings.show === 'label (percent)') {
    return `${d.name} (${isNaN(d.percentRound) ? 0 : d.percentRound}%)`;
  }

  if (settings.show === 'label (value)') {
    return `${d.name} (${settings.formatter ? d3.format(settings.formatter)(d.value) : d.value})`;
  }

  if (settings.show === 'percent') {
    return `${isNaN(d.percentRound) ? 0 : d.percentRound}%`;
  }

  if (typeof settings.show === 'function') {
    return settings.show(d);
  }

  return d.value;
};

/**
* Add Toolbar to the page.
* @private
* @param {string} extraClass class to add (needed for pie)
* @returns {void}
*/
charts.appendTooltip = function appendTooltip(extraClass) {
  this.tooltip = $('#svg-tooltip');
  if (this.tooltip.length === 0) {
    this.tooltip = $(`<div id="svg-tooltip" class="tooltip ${extraClass} right is-hidden">
      <div class="arrow"></div>
        <div class="tooltip-content">
          <p><b>32</b> Element</p>
        </div>
      </div>`).appendTo('body');

    if (this.isTouch) {
      this.tooltip[0].style.pointerEvents = 'auto';
      this.tooltip.on('touchend.svgtooltip', () => {
        this.hideTooltip();
      });
    }
  }
};

/**
 * Hide the visible tooltip.
 * @private
 * @returns {void}
 */
charts.hideTooltip = function hideTooltip() {
  d3.select('#svg-tooltip')
    .classed('is-personalizable', false)
    .classed('is-hidden', true).style('left', '-999px');

  // Remove scroll events
  $('body, .scrollable').off('scroll.chart-tooltip', () => {
    this.hideTooltip();
  });
};

/**
 * Remove the tooltip from the DOM
 * @private
 * @returns {void}
 */
charts.removeTooltip = function removeTooltip() {
  if (this.tooltip && this.tooltip.remove) {
    this.tooltip.remove();
  }
};

/**
 * The color sequences to use across charts
 * @private
 * @returns {array} The list of colors in the current theme in a range for charts.
 */
charts.colorRange = () => {
  const palette = theme.themeColors().palette;
  return [
    palette.azure['70'].value,
    palette.turquoise['30'].value,
    palette.amethyst['30'].value,
    palette.graphite['60'].value,
    palette.amber['50'].value,
    palette.emerald['60'].value,
    palette.ruby['60'].value,
    palette.azure['30'].value,
    palette.amber['90'].value,
    palette.turquoise['80'].value,
    palette.ruby['20'].value,
    palette.graphite['50'].value,
    palette.emerald['50'].value,
    palette.azure['50'].value,
    palette.amethyst['80'].value,
    palette.emerald['30'].value,
    palette.turquoise['50'].value,
    palette.amber['70'].value,
    palette.graphite['20'].value,
    palette.azure['20'].value,
    palette.emerald['100'].value,
    palette.amethyst['20'].value
  ];
};

charts.colorNameRange = ['azure07', 'turquoise03', 'amethyst03', 'graphite06', 'amber05', 'emerald06', 'ruby06',
  'azure03', 'amber09', 'turquoise08', 'ruby02', 'graphite05', 'emerald05', 'amethyst03',
  'azure05', 'amethyst08', 'emerald03', 'turquoise06', 'amber07', 'graphite02'];

/**
 * The colors as an array for placement
 * @param {number} idx The color index
 * @returns {function} A d3 range of colors.
 */
charts.colorNames = typeof d3 !== 'undefined' ? d3.scaleOrdinal().range(charts.colorNameRange) : [];

/**
 * Calculate and return the correct color to use. Fx
 * error, alert, alertYellow, good, neutral or hex.
 * @private
 * @param  {number} i The line/bar object index.
 * @param  {string} chartType The type of chart.
 * @param  {object} data The data for this element.
 * @returns {string} The hex code
 */
charts.chartColor = function chartColor(i, chartType, data) {
  const themeColors = charts.colorRange();
  const specifiedColor = (data && data.color ? data.color : null);

  // Handle passed in colors.
  if (specifiedColor) {
    if (specifiedColor === 'error') {
      return theme.themeColors().status.danger.value;
    }
    if (specifiedColor === 'alert') {
      return theme.themeColors().status.warning.value;
    }
    if (specifiedColor === 'alertYellow') {
      return theme.themeColors().status.caution.value;
    }
    if (specifiedColor === 'good') {
      return theme.themeColors().status.success.value;
    }
    if (specifiedColor === 'neutral') {
      return theme.themeColors().palette.graphite['30'].value;
    }
    if (specifiedColor && specifiedColor.indexOf('#') === 0) {
      return data.color;
    }
  }

  // Some configuration by specific chart types
  if (/^(pie|donut)$/.test(chartType)) {
    return themeColors[i];
  }
  if (/^(bar-single|column-single)$/.test(chartType)) {
    return theme.themeColors().palette.azure['80'].value;
  }
  if (/^(bar|bar-stacked|bar-grouped|bar-normalized|line|scatterplot|column-stacked|column-grouped|column-positive-negative)$/.test(chartType)) {
    return themeColors[i];
  }

  return '';
};

charts.chartColorName = function chartColor(i, chartType, data) {
  const specifiedColor = (data && data.color ? data.color : null);

  // Handle passed in colors.
  if (specifiedColor) {
    if (specifiedColor === 'error') {
      return 'alert01';
    }
    if (specifiedColor === 'alert') {
      return 'alert02';
    }
    if (specifiedColor === 'alertYellow') {
      return 'alert03';
    }
    if (specifiedColor === 'good') {
      return 'alert04';
    }
    if (specifiedColor === 'neutral') {
      return 'graphite03';
    }
    if (specifiedColor && specifiedColor.indexOf('#') === 0) {
      return data.color;
    }
  }

  // Some configuration by specific chart types
  if (/^(pie|donut)$/.test(chartType)) {
    return this.colorNameRange[i];
  }
  if (/^(bar-single|column-single)$/.test(chartType)) {
    return 'azure08';
  }
  if (/^(bar|bar-stacked|bar-grouped|bar-normalized|line|scatterplot|column-stacked|column-grouped|column-positive-negative)$/.test(chartType)) {
    return this.colorNames(i);
  }

  return '';
};

/**
 * Show Tooltip
 * @private
 * @param  {number} x The x position.
 * @param  {number} y The y position.
 * @param  {string} content The tooltip contents.
 * @param  {string} arrow The arrow direction.
 */
charts.showTooltip = function (x, y, content, arrow) {
  // Simple Collision of left side
  if (x < 0) {
    x = 2;
  }

  this.tooltip[0].style.left = `${x}px`;
  this.tooltip[0].style.top = `${y}px`;
  DOM.html(this.tooltip.find('.tooltip-content'), content, '*');

  this.tooltip.removeClass('bottom top left right').addClass(arrow);
  this.tooltip.removeClass('is-hidden');

  // Hide the tooltip when the page scrolls.
  $('body').off('scroll.chart-tooltip').on('scroll.chart-tooltip', () => {
    this.hideTooltip();
  });

  $('.scrollable').off('scroll.chart-tooltip').on('scroll.chart-tooltip', () => {
    this.hideTooltip();
  });
};

/**
 * Add the legend to the Chart Container.
 * @private
 * @param  {array} series The groups series object.
 * @param  {string} chartType The type of chart.
 * @param  {object} settings The chart setting
 * @param  {object} container The dom container.
 * @returns {void}
 */
charts.addLegend = function (series, chartType, settings, container) {
  let i;
  if (series.length === 0) {
    return;
  }

  const isTwoColumn = series[0].display && series[0].display === 'twocolumn';
  let legend = isTwoColumn ? $(`<div class="chart-legend ${
    series[0].placement ? `is-${series[0].placement}` : 'is-bottom'}"></div>`) :
    $('<div class="chart-legend"></div>');

  if ((chartType === 'pie' || chartType === 'donut') && settings.showMobile) {
    legend = $('<div class="chart-legend"><div class="container"></div></div>');
  }

  // Legend width
  let width = 0;
  let currentWidth;

  for (i = 0; i < series.length; i++) {
    currentWidth = series[i].name ? series[i].name.length * 6 : 6;
    width = (series[i].name && currentWidth > width) ? currentWidth : width;
  }

  width += 55;
  const widthPercent = width / $(container).width() * 100;

  for (i = 0; i < series.length; i++) {
    if (!series[i].name) {
      continue; // eslint-disable-line
    }

    let extraClass = '';
    if (isTwoColumn || (series[i].display && series[i].display === 'block')) {
      extraClass += ' lg';
    }
    if (settings.type === 'column-positive-negative' && series[i].option) {
      extraClass += ` ${series[i].option}`;
    }

    let seriesLine = `<span class="chart-legend-item${extraClass}" tabindex="0"></span>`;
    const hexColor = charts.chartColor(i, chartType || (series.length === 1 ? 'bar-single' : 'bar'), series[i]);
    const colorName = charts.chartColorName(i, chartType || (series.length === 1 ? 'bar-single' : 'bar'), series[i]);

    let color = '';
    if (colorName.substr(0, 1) === '#') {
      color = $('<span class="chart-legend-color"></span>');
      if (!series[i].pattern) {
        color.css('background-color', hexColor);
      }
    } else {
      color = $(`<span class="chart-legend-color ${series[i].pattern ? '' : colorName}"></span>`);
    }

    if (chartType === 'scatterplot') {
      color = $('<span class="chart-legend-color"></span>');
    }
    const textBlock = $(`<span class="chart-legend-item-text">${xssUtils.stripTags(series[i].name)}</span>`);

    if (series[i].pattern) {
      color.append(`<svg width="12" height="12"><rect height="12" width="12" mask="url(#${series[i].pattern})"/></svg>`);
      color.find('rect').css('fill', hexColor);
    }

    if (series[i].percent) {
      const pct = $('<span class="chart-legend-percent"></span>').text(series[i].percent);
      textBlock.append(pct);
    }

    if (series[i].display && series[i].display === 'block') {
      seriesLine = `<span class="chart-legend-item${extraClass}" tabindex="0"></span>`;
    }

    if (isTwoColumn) {
      if (widthPercent > 45 && settings.legendPlacement !== 'right') {
        seriesLine = `<span class="chart-legend-item${extraClass}" tabindex="0"></span>`;
      } else {
        seriesLine = `<span class="chart-legend-item${extraClass} is-two-column" tabindex="0" ></span>`;
      }
    }
    seriesLine = $(seriesLine);
    seriesLine.append(color, textBlock);

    if ((chartType === 'pie' || chartType === 'donut') && settings.showMobile) {
      legend.find('.container').append(seriesLine);
    } else {
      legend.append(seriesLine);
    }

    if ((series[i].display && series[i].display === 'block') || (isTwoColumn && widthPercent > 45 && settings.legendPlacement !== 'right')) {
      seriesLine.css({
        float: 'none',
        display: 'block',
        margin: '0 auto',
        width: `${width}px`,
      });
    }

    // Add shapes
    if (chartType === 'scatterplot') {
      self.svg = d3.select(color[0]).append('svg')
        .attr('width', '24')
        .attr('height', '24')
        .append('path')
        .attr('class', 'symbol')
        .attr('transform', 'translate(10, 10)')
        .attr('d', d3.symbol().size('80').type( () => { return d3.symbols[i]; })) //eslint-disable-line
        .style('fill', hexColor);
    }

    // Change text of legend depends of the width
    if (innerWidth <= 480 && series[i].data && series[i].data.legendAbbrName) {
      textBlock.replaceWith(`<span class="chart-legend-item-text">${series[i].data.legendAbbrName}</span>`);
    }
    if (innerWidth >= 481 && innerWidth <= 768 && series[i].data
      && series[i].data.legendShortName) {
      textBlock.replaceWith(`<span class="chart-legend-item-text">${series[i].data.legendShortName}</span>`);
    }
  }

  if (legend instanceof $) {
    legend.on('click.chart', '.chart-legend-item', function () {
      charts.handleElementClick(this, series, settings);
    }).on('keypress.chart', '.chart-legend-item', function (e) {
      if (e.which === 13 || e.which === 32) {
        charts.handleElementClick(this, series, settings);
      }
    });

    $(container).append(legend);
  }
};

/**
 * Helper Function to Select from legend click
 * @private
 * @param {object} line The element that was clicked.
 * @param {array} series The data series.
 * @param {object} settings [description]
 */
charts.handleElementClick = function (line, series, settings) {
  const idx = $(line).index();
  const elem = series[idx];
  let selector;

  if (settings.type === 'radar') {
    selector = d3.select(settings.svg.selectAll('.chart-radar-area').nodes()[idx]);
  }

  if (settings.type === 'pie' || settings.type === 'donut') {
    selector = d3.select(settings.svg.selectAll('.slice').nodes()[idx]);
  } else if (settings.type === 'column-positive-negative') {
    if (!elem.option || (elem.option && elem.option === 'target')) {
      selector = settings.svg.select('.target-bar');
    } else {
      selector = settings.svg.select(`.bar.${elem.option}`);
    }
  } else if (['column', 'bar', 'bar-stacked', 'bar-grouped', 'bar-normalized', 'column-grouped', 'column-stacked', 'column-positive-negative'].indexOf(settings.type) !== -1) {
    // Grouped or singlular
    if (settings.isGrouped || settings.isSingle) {
      selector = settings.svg.select(`.series-${idx}`);
    } else if (settings.isStacked && !settings.isSingle) {
      // Stacked
      const thisGroup = d3.select(settings.svg.selectAll(settings.type === 'bar' || settings.type === 'bar-stacked' || settings.type === 'bar-normalized' ? '.series-group' : '.g').nodes()[idx]); // eslint-disable-line
      selector = thisGroup.select('.bar');
    }
  }

  if (['radar', 'pie', 'donut', 'column', 'bar', 'bar-stacked', 'bar-grouped', 'bar-normalized',
    'column-grouped', 'column-stacked', 'column-positive-negative'].indexOf(settings.type) !== -1) {
    charts.clickedLegend = true;
    selector.dispatch('click');
  }

  if (elem.selectionObj) {
    charts.selectElement(d3.select(elem.selectionObj.nodes()[idx]), elem.selectionInverse, elem.data); // eslint-disable-line
  }
};

// The selected array for this instance.
charts.selected = [];

/**
 * Select the element and fire the event, make the inverse selector opace.
 * @private
 * @param  {object} element The DOM element
 * @param  {object} inverse The opposite selection.
 * @param  {array} data  The data object
 * @param  {object} container  The DOM object
 */
charts.selectElement = function (element, inverse, data, container) {
  const isSelected = element.node() && element.classed('is-selected');
  const triggerData = [{ elem: element.nodes(), data: (!isSelected ? data : {}) }];

  inverse.classed('is-selected', false)
    .classed('is-not-selected', !isSelected);

  element.classed('is-not-selected', false)
    .classed('is-selected', !isSelected);

  charts.selected = $.isEmptyObject(triggerData[0].data) ? [] : triggerData;

  // Fire Events
  $(container).triggerHandler('selected', [triggerData]);
};

/**
 * Style bars as selected or unselected
 * TODO: Refactor into individual components;
 * @private
 * @param  {object} o The object to handle.
 */
charts.setSelectedElement = function (o) {
  let dataset = o.dataset;
  const isPositiveNegative = o.type === 'column-positive-negative';
  const isBar = /^(bar|bar-stacked|bar-grouped|bar-normalized)$/.test(o.type);
  const isTypePie = o.type === 'pie' || o.type === 'donut';
  const isTypeColumn = /^(column|column-grouped|column-stacked|column-positive-negative)$/.test(o.type);

  const svg = o.svg;
  const isSingle = o.isSingle;
  const isGrouped = o.isGrouped;
  const isStacked = o.isStacked;

  const taskSelected = (o.task === 'selected');
  const selector = d3.select(o.selector);
  const isPositive = selector.classed('positive');
  const ticksX = o.svg.selectAll('.axis.x .tick');
  const ticksY = o.svg.selectAll('.axis.y .tick');
  const pnPositiveText = o.svg.selectAll('.bartext.positive, .target-bartext.positive');
  const pnNegativeText = o.svg.selectAll('.bartext.negative, .target-bartext.negative');
  const pnTargetText = o.svg.selectAll('.target-bartext.positive, .target-bartext.negative');
  const thisGroup = d3.select(o.selector.parentNode);
  const thisGroupId = parseInt((thisGroup.node() ? thisGroup.attr('data-group-id') : 0), 10);
  let triggerData = [];
  const selectedBars = [];
  let thisData;

  if (isStacked || isTypePie) {
    dataset = dataset || null;
  } else {
    dataset = (dataset && dataset[thisGroupId]) ?
      (dataset[thisGroupId].data || dataset[thisGroupId]) : null;
  }

  ticksX.style('font-weight', 'normal');
  ticksY.style('font-weight', 'normal');
  pnPositiveText.style('font-weight', 'normal');
  pnNegativeText.style('font-weight', 'normal');
  svg.selectAll('.is-selected').classed('is-selected', false);

  if (isTypePie) {
    svg.selectAll('.is-not-selected').classed('is-not-selected', false);
  }

  // Task make selected
  if (taskSelected) {
    svg.selectAll('.bar, .target-bar').style('opacity', 0.6);

    // By legends only
    if (charts.clickedLegend && !isTypePie) {
      if (isPositiveNegative) {
        if (o.isTargetBar) {
          o.svg.selectAll('.target-bar').classed('is-selected', true).style('opacity', 1);

          pnTargetText.style('font-weight', 'bolder');
        } else {
          o.svg.selectAll(isPositive ?
            '.bar.positive, .target-bar.positive' : '.bar.negative, .target-bar.negative')
            .classed('is-selected', true).style('opacity', 1);

          (isPositive ? pnPositiveText : pnNegativeText).style('font-weight', 'bolder');
        }

        svg.selectAll('.bar').each(function (d, i) {
          const bar = d3.select(this);
          if (bar.classed('is-selected')) {
            selectedBars.push({ elem: bar.node(), data: (dataset ? dataset[i] : d) });
          }
        });
        triggerData = selectedBars;
      } else if (isTypeColumn || isBar) {
        // Grouped and stacked only -NOT singular-

        if (isGrouped || isSingle) {
          o.svg.selectAll('.series-' + o.i).classed('is-selected', true).style('opacity', 1); //eslint-disable-line
        } else {
          thisGroup.classed('is-selected', true)
            .selectAll('.bar').classed('is-selected', true).style('opacity', 1);
        }

        svg.selectAll('.bar.is-selected').each(function (d, i) {
          const bar = d3.select(this);

          thisData = o.dataset;
          if (!thisData) {
            thisData = d;
          }

          if (isBar) {
            if (thisData[i][o.i]) {
              thisData = thisData[i][o.i];
            }

            if (thisData[o.i] && thisData[o.i][i]) {
              thisData = thisData[o.i][i];
            }

            if (thisData[i] && thisData[i][o.i]) {
              thisData = thisData[i][o.i];
            }
          } else if (isStacked && !isSingle) {
            if (thisData[thisGroupId] && thisData[thisGroupId].data[i]) {
              thisData = thisData[thisGroupId].data[i];
            }
          } else {
            if (thisData[i].data[o.i]) {
              thisData = thisData[i].data[o.i];
            }

            if (thisData[o.i] && thisData[o.i].data[i]) {
              thisData = thisData[o.i].data[i];
            }

            if (thisData[i] && thisData[i].data[o.i]) {
              thisData = thisData[i].data[o.i];
            }
          }

          selectedBars.push({ elem: bar.node(), data: thisData });
        });
        triggerData = selectedBars;
      }
    } else if (isSingle && isStacked && isTypeColumn) {
      // Single and stacked only -NOT grouped-
      thisData = dataset[0] && dataset[0].data ? dataset[0].data : o.d;
      selector.classed('is-selected', true).style('opacity', 1);
      triggerData.push({ elem: selector.nodes(), data: thisData[o.i] });
    } else if ((isSingle || isGrouped) && !isStacked && (isTypeColumn || isBar)) {
      // Single or groups only -NOT stacked-
      svg.selectAll(`${isTypeColumn ? '.axis.x' : '.axis.y'} .tick:nth-child(${(isGrouped ? thisGroupId : o.i) + 2})`)
        .style('font-weight', 'bolder');

      selector.classed('is-selected', true).style('opacity', 1);

      if (isPositiveNegative) {
        const thisIndex = o.isTargetBar ? o.i : o.i - o.dataset[0].data.length;
        svg.select(`.target-bar.series-${thisIndex}`).classed('is-selected', true).style('opacity', 1);
        svg.select(`.bar.series-${thisIndex}`).classed('is-selected', true).style('opacity', 1);

        d3.select(svg.selectAll('.bartext').nodes()[thisIndex]).style('font-weight', 'bolder');
        d3.select(svg.selectAll('.target-bartext').nodes()[thisIndex]).style('font-weight', 'bolder');
      }

      if (isGrouped || isPositiveNegative || isTypeColumn) {
        if (!isPositiveNegative && !isTypeColumn || (isTypeColumn && isGrouped)) {
          thisGroup.classed('is-selected', true)
            .selectAll('.bar').classed('is-selected', true).style('opacity', 1);
        }

        thisGroup.selectAll('.bar').each(function (d, i) {
          const bar = d3.select(this);
          if (bar.classed('is-selected')) {
            selectedBars.push({ elem: bar.node(), data: (dataset ? dataset[i] : d) });
          }
        });
        if (isGrouped) {
          triggerData.push({
            groupIndex: thisGroupId,
            groupElem: thisGroup.nodes()[0],//eslint-disable-line
            groupItems: selectedBars
          });
        } else {
          triggerData = selectedBars;
        }
      }
    } else if (isTypeColumn || isBar) {
      // Stacked Only
      svg.selectAll(`${isTypeColumn ? '.axis.x' : '.axis.y'} .tick:nth-child(${o.i + 2})`)
        .style('font-weight', 'bolder');

      svg.selectAll(`.bar:nth-child(${o.i + 1})`)
        .classed('is-selected', true).style('opacity', 1);

      svg.selectAll('.bar.is-selected').each(function (d, i) {
        const bar = d3.select(this);
        let data = d;
        if (dataset) {
          data = isBar && isStacked ? dataset[i][o.i] : dataset[i].data[o.i];
        }
        selectedBars.push({ elem: bar.node(), data });
      });
      triggerData = selectedBars;
    } else if (isTypePie) { // Pie
      // Unselect selected ones
      svg.selectAll('.slice')
        .classed('is-selected', false)
        .classed('is-not-selected', true)
        .attr('transform', '');

      const thisArcData = dataset && dataset[0] && dataset[0].data ?  //eslint-disable-line
        dataset[0].data[o.i] : (o.d ? o.d.data : o.d);  //eslint-disable-line

      selector.classed('is-selected', true)
        .classed('is-not-selected', false)
        .attr('transform', 'scale(1.025, 1.025)');
      triggerData.push({ elem: selector.nodes(), data: thisArcData, index: o.i });
    }
  } else {
    // Task make unselected
    svg.selectAll('.bar, .target-bar').style('opacity', 1);
    pnPositiveText.style('font-weight', 'bolder');
    pnNegativeText.style('font-weight', 'bolder');

    if (isTypePie) {
      selector.classed('is-selected', false)
        .style('stroke', '#fff')
        .style('stroke-width', '1px')
        .attr('transform', '');
    }
  }

  if (charts.clickedLegend) {
    charts.clickedLegend = false;
  }

  charts.selected = triggerData;

  if (o.isTrigger) {
    $(o.container).triggerHandler((taskSelected ? 'selected' : 'unselected'), [triggerData]);
  }
};

/**
 * Set the select element based on provided options and fire the events.
 * @private
 * @param {object} o An object with various
 * @param {boolean} isToggle If the select is a toggle of the state
 * @param {object} internals An object passing in chart internals
*/
charts.setSelected = function (o, isToggle, internals) {
  if (!o) {
    return;
  }

  let selected = 0;
  const equals = utils.equals;
  const legendsNode = internals.isPie ? internals.svg.node().nextSibling :
    internals.svg.node().parentNode.nextSibling;
  const legends = d3.select(legendsNode);
  const isLegends = legends.node() && legends.classed('chart-legend');
  let barIndex;
  let selector;
  let isStackedGroup;
  let xGroup;

  const setSelectedBar = function (g) {
    const isGroup = !!g;
    g = isGroup ? d3.select(g) : internals.svg;
    g.selectAll('.bar').each(function (d, i) {
      if (!d) {
        return;
      }
      if (selected < 1) {
        if ((typeof o.fieldName !== 'undefined' &&
              typeof o.fieldValue !== 'undefined' &&
                o.fieldValue === d[o.fieldName]) ||
            (typeof o.index !== 'undefined' && o.index === i) ||
            (o.data && equals(o.data, internals.chartData[d.index].data[i])) ||
            (o.elem && $(this).is(o.elem))) {
          selected++;
          selector = d3.select(this);
          barIndex = i;
          if (isGroup && !internals.isStacked) {
            isStackedGroup = true;
          }
        }
      }
    });
  };

  const setSelectedGroup = function () {
    const groups = internals.svg.selectAll('.series-group');

    if (groups.nodes().length) {
      groups.each(function () {
        setSelectedBar(this);
      });
    }
  };

  if (internals.isGrouped || (internals.isStacked && !internals.isSingle)) {
    internals.chartData.forEach(function(d, i) {  //eslint-disable-line
      if (selected < 1) {
        xGroup = $(internals.svg.select('[data-group-id="' + i + '"]').node()); //eslint-disable-line
        if ((typeof o.groupName !== 'undefined' &&
              typeof o.groupValue !== 'undefined' &&
                o.groupValue === d[o.groupName]) ||
            (typeof o.groupIndex !== 'undefined' && o.groupIndex === i) ||
            (o.data && equals(o.data, d)) ||
            (o.elem && (xGroup.is(o.elem)))) {
          if (typeof o.fieldName === 'undefined' &&
                typeof o.fieldValue === 'undefined' &&
                  typeof o.index === 'undefined') {
            selected++;
            selector = internals.svg.select('[data-group-id="' + i + '"]').select('.bar'); //eslint-disable-line
            barIndex = i;

            if (internals.isStacked && !internals.isGrouped) {
              isStackedGroup = true;
            }
          }
        }
      }
    });
    if (selected < 1) {
      setSelectedGroup();
    }
  } else {
    setSelectedBar();
  }

  if (selected > 0 && (isToggle || !selector.classed('is-selected'))) {
    if (isStackedGroup) {
      if (isLegends) {
        $(legends.selectAll('.chart-legend-item').nodes()[barIndex]).trigger('click.chart');
      }
    } else {
      selector.on('click').call(selector.node(), selector.datum(), barIndex);
    }
  }
};

/**
 * Check if the labels collide.
 * @private
 * @param {object} svg The svg dom element.
 * @returns {boolean} True if the labels collide.
*/
charts.labelsColide = function (svg) {
  const ticks = svg.selectAll('.x text');
  let collides = false;

  ticks.each(function (d1, i) {
    const rect1 = this.getBoundingClientRect();
    let rect2;

    ticks.each(function (d2, j) {
      if (i !== j) {
        rect2 = this.getBoundingClientRect();

        const overlaps = !(rect1.right < rect2.left ||
          rect1.left > rect2.right ||
          rect1.bottom < rect2.top ||
          rect1.top > rect2.bottom);

        if (overlaps) {
          collides = true;
        }
      }
    });
  });

  return collides;
};

/**
 * Apply a different length label
 * @private
 * @param  {object}  svg  The svg element.
 * @param  {array}  dataArray The data.
 * @param  {object}  elem The dom element
 * @param  {object}  selector The d3 selection
 * @param  {boolean} isNoEclipse True if its an eclipse.
 */
charts.applyAltLabels = function (svg, dataArray, elem, selector, isNoEclipse) {
  const ticks = selector ? svg.selectAll(selector) : svg.selectAll('.x text');

  ticks.each(function (d1, i) {
    let text = dataArray[i] ? dataArray[i][elem] : '';

    text = text || (isNoEclipse ?
      ((d3.select(this).text().substring(0, 1))) :
      (`${d3.select(this).text().substring(0, 6)}...`));

    d3.select(this).text(text);
  });
};

/**
 * Trigger the right click event.
 * @private
 * @param  {object} container  The svg container.
 * @param  {object} elem The element that was right clicked.
 * @param  {object} d The data object
 */
charts.triggerContextMenu = function (container, elem, d) {
  d3.event.preventDefault();
  d3.event.stopPropagation();
  d3.event.stopImmediatePropagation();

  const e = $.Event('contextmenu');
  e.target = elem;
  e.pageX = d3.event.pageX;
  e.pageY = d3.event.pageY;
  $(container).trigger(e, [elem, d]);
};

/**
 * Wraps SVG text http://bl.ocks.org/mbostock/7555321
 * @private
 * @param {object} node  The svg element.
 * @param {number}  width The width at which to wrap
 * @param {object} labelFactor The dom element
 */
charts.wrap = function (node, width, labelFactor) {
  if (!labelFactor) {
    labelFactor = 1.27;
  }

  if (!width) {
    labelFactor = 60;
  }

  node.each(function () {
    const text = d3.select(this);
    const words = text.text().split(/\s+/).reverse();
    let word = '';
    let line = [];
    let lineNumber = 0;

    if (words.length <= 1) {
      return;
    }

    const lineHeight = labelFactor; // ems
    const y = text.attr('y');
    const x = text.attr('x');
    const dy = parseFloat(text.attr('dy'));
    let tspan = text.text(null).append('tspan')
      .attr('x', x)
      .attr('y', y)
      .attr('dy', `${dy}em`);

    while (word = words.pop()) {    //eslint-disable-line
      line.push(word);
      tspan.text(line.join(' '));

      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        tspan = text.append('tspan')
          .attr('x', x)
          .attr('y', y)
          .attr('dy', `${++lineNumber * lineHeight + dy}em`)
          .text(word);
      }
    }
  });
};

export { charts };
