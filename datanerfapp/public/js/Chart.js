const params = {
  selector: '#svgChart',
  dataLoadUrl: './js/nerf-herders-test-data.json', // for larger json files, "JSON.parse()" or "for loops" for map-lookup can be used to make changes through the entire file.
  chartWidth: window.innerWidth,
  chartHeight: window.innerHeight - 125,
  data: null,
};

d3.json(params.dataLoadUrl, (data) => {
  params.data = data;
  params.pristinaData = JSON.parse(JSON.stringify(data));

  drawOrganizationChart(params);
});

function drawOrganizationChart(params) {

  const attrs = {
    EXPAND_SYMBOL: '+',
    COLLAPSE_SYMBOL: '-',
    selector: params.selector,
    root: params.data,
    width: params.chartWidth,
    height: params.chartHeight,
    index: 0,
    nodePadding: 9,
    collapseCircleRadius: 7,
    nodeHeight: 80,
    nodeWidth: 210,
    duration: 750,
    rootNodeTopMargin: 20,
    minMaxZoomProportions: [0.05, 3],
    linkLineSize: 180,
    collapsibleFontSize: '30px',
    nodeStroke: '#ccc',
  };

  const dynamic = {};
  dynamic.rootNodeLeftMargin = attrs.width / 2;

  const tree = d3.layout.tree().nodeSize([attrs.nodeWidth + 40, attrs.nodeHeight]);
  const diagonal = d3.svg.diagonal()
    .projection((d) => {
      return [d.x + attrs.nodeWidth / 2, d.y + attrs.nodeHeight / 2];
    });

  const zoomBehaviours = d3.behavior
    .zoom()
    .scaleExtent(attrs.minMaxZoomProportions)
    .on('zoom', redraw);

  const svg = d3.select(attrs.selector)
    .append('svg')
    .attr('width', attrs.width)
    .attr('height', attrs.height)
    .call(zoomBehaviours)
    .append('g')
    .attr('transform', `translate(${attrs.width / 2.25},${20})`);

  // necessary so that zoom knows where to zoom and unzoom from
  zoomBehaviours.translate([dynamic.rootNodeLeftMargin, attrs.rootNodeTopMargin]);

  attrs.root.x0 = 0;
  attrs.root.y0 = dynamic.rootNodeLeftMargin;

  if (params.mode != 'department') {
    // adding unique values to each node recursively
    let uniq = 1;
    addPropertyRecursive('uniqueIdentifier', (v) => uniq++, attrs.root);
  }

  expand(attrs.root);
  if (attrs.root.children) {
    attrs.root.children.forEach(collapse);
  }

  update(attrs.root);

  d3.select(attrs.selector).style('height', attrs.height);

  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'customTooltip-wrapper');

  function update(source, param) {
    // Compute the new tree layout.
    const nodes = tree.nodes(attrs.root)
      .reverse();
    const links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach((d) => {
      d.y = d.depth * attrs.linkLineSize + 50;
    });

    // Update the nodes…
    const node = svg.selectAll('g.node')
      .data(nodes, (d) => d.id || (d.id = ++attrs.index));

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node.enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${source.x0},${source.y0})`);

    const nodeGroup = nodeEnter.append('g')
      .attr('class', 'node-group');

    nodeGroup.append('rect')
      .attr('width', attrs.nodeWidth)
      .attr('height', attrs.nodeHeight)
      .attr('data-node-group-id', (d) => d.uniqueIdentifier)
      .attr('class', (d) => {
        let res = '';
        if (d.isLoggedUser) res += 'nodeRepresentsCurrentUser ';
        res += d._children || d.children ? 'nodeHasChildren' : 'nodeDoesNotHaveChildren';
        return res;
      });

    const collapsiblesWrapper = nodeEnter.append('g')
      .attr('data-id', (v) => v.uniqueIdentifier);

    const collapsibles = collapsiblesWrapper.append('circle')
      .attr('class', 'node-collapse')
      .attr('cx', 102)
      .attr('cy', attrs.nodeHeight + 3)
      .attr('', setCollapsibleSymbolProperty);

    // hide collapse rect when node does not have children
    collapsibles.attr('r', (d) => {
      if (d.children || d._children) return attrs.collapseCircleRadius;
      return 0;
    })
      .attr('height', attrs.collapseCircleRadius);

    collapsiblesWrapper.append('text')
      .attr('class', 'text-collapse')
      .attr('x', 102)
      .attr('y', attrs.nodeHeight + 12)
      .attr('width', attrs.collapseCircleRadius)
      .attr('height', attrs.collapseCircleRadius)
      .style('font-size', attrs.collapsibleFontSize)
      .attr('text-anchor', 'middle')
      .style('font-family', 'FontAwesome')
      .text((d) => d.collapseText);

    collapsiblesWrapper.on('click', click);

    nodeGroup.append('text')
      .attr('x', attrs.nodePadding + 87)
      .attr('y', attrs.nodePadding + 10)
      .attr('class', 'name')
      .attr('text-anchor', 'left')
      .text((d) => d.name.trim())
      .call(wrap, attrs.nodeWidth);

    nodeGroup.append('text')
      .attr('x', attrs.nodePadding)
      .attr('y', attrs.nodePadding + 20)
      .attr('class', 'description')
      .attr('dy', '.35em')
      .attr('text-anchor', 'left')
      .text((d) => {
        let position = d.description.substring(0, 30);
        if (position.length < d.description.length) {
          position = `${position.substring(0, 27)}...`;
        }
        return position;
      });

    nodeGroup.append('text')
      .attr('x', attrs.nodePadding)
      .attr('y', attrs.nodePadding + 35)
      .attr('class', 'parent')
      .attr('dy', '.35em')
      .attr('text-anchor', 'left')

      .text((d) => d.area);

    nodeGroup.append('text')
      .attr('x', 10)
      .attr('y', 70)
      .attr('class', 'count')
      .attr('text-anchor', 'left')

      .text((d) => {
        if (d.children) return d.children.length;
        if (d._children) return d._children.length;
      });

    // Transition nodes to their new position.
    const nodeUpdate = node.transition()
      .duration(attrs.duration)
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node.exit().transition()
      .duration(attrs.duration)
      .attr('transform', (d) => `translate(${source.x},${source.y})`)
      .remove();

    nodeExit.select('rect')
      .attr('width', attrs.nodeWidth)
      .attr('height', attrs.nodeHeight);

    // Update the links…
    const link = svg.selectAll('path.link')
      .data(links, (d) => d.target.id);

    // Enter any new links at the parent's previous position.
    link.enter().insert('path', 'g')
      .attr('class', 'link')
      .attr('x', attrs.nodeWidth / 2)
      .attr('y', attrs.nodeHeight / 2)
      .attr('d', (d) => {
        const o = {
          x: source.x0,
          y: source.y0,
        };
        return diagonal({
          source: o,
          target: o,
        });
      });

    // Transition links to their new position.
    link.transition()
      .duration(attrs.duration)
      .attr('d', diagonal)
    ;

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
      .duration(attrs.duration)
      .attr('d', (d) => {
        const o = {
          x: source.x,
          y: source.y,
        };
        return diagonal({
          source: o,
          target: o,
        });
      })
      .remove();

    // Stash the old positions for transition.
    nodes.forEach((d) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    if (param && param.locate) {
      let x;
      let y;

      nodes.forEach((d) => {
        if (d.uniqueIdentifier == param.locate) {
          x = d.x;
          y = d.y;
        }
      });
    }

    /* ################  TOOLTIP  ############################# */

    function tooltipContent(item) {
      let strVar = '';

      strVar += '  <div class="customTooltip">';
      strVar += '    <!--';
      strVar += '    <div class="tooltip-image-wrapper"> <img width="300" src="https://raw.githubusercontent.com/bumbeishvili/Assets/master/Projects/D3/Organization%20Chart/cto.jpg"> </div>';
      strVar += '-->';
      strVar += '    <div class="tooltip-hr"></div>';
      strVar += '    <div class="tooltip-desc">';
      strVar += `      <p class="name"> ${item.name}</p>`;
      strVar += `      <p class="position">${item.description} </p>`;
      strVar += `      <p class="parent">${item.area} </p>`;
      strVar += '';
      strVar += '      <h4 class="tags-wrapper">             <span class="title"><i class="fa fa-tags" aria-hidden="true"></i>';
      strVar += '        ';
      strVar += `        </span>           <ul class="tags"></ul>         </h4> </div>`;
      strVar += '    <div class="bottom-tooltip-hr"></div>';
      strVar += '  </div>';
      strVar += '';

      return strVar;
    }

    function tooltipHoverHandler(d) {
      const content = tooltipContent(d);
      tooltip.html(content);

      tooltip.transition()
        .duration(200).style('opacity', '1').style('display', 'block');
      d3.select(this).attr('cursor', 'pointer').attr('stroke-width', 50);

      let y = d3.event.pageY;
      let x = d3.event.pageX;

      // restrict tooltip to fit in borders
      if (y < 220) {
        y += 220 - y;
        x += 130;
      }

      if (y > attrs.height - 300) {
        y -= 300 - (attrs.height - y);
      }

      tooltip.style('top', `${y - 300}px`)
        .style('left', `${x - 470}px`);
    }

    function tooltipOutHandler() {
      tooltip.transition()
        .duration(200)
        .style('opacity', '0').style('display', 'none');
      d3.select(this).attr('stroke-width', 5);
    }

    nodeGroup.on('click', tooltipHoverHandler);

    nodeGroup.on('dblclick', tooltipOutHandler);

    function equalToEventTarget() {
      return this == d3.event.target;
    }

    d3.select('body').on('click', () => {
      const outside = tooltip.filter(equalToEventTarget).empty();
      if (outside) {
        tooltip.style('opacity', '0').style('display', 'none');
      }
    });
  }

  // Toggle children on click.
  function click(d) {
    d3.select(this).select('text').text((dv) => {
      if (dv.collapseText == attrs.EXPAND_SYMBOL) {
        dv.collapseText = attrs.COLLAPSE_SYMBOL;
      } else if (dv.children) {
        dv.collapseText = attrs.EXPAND_SYMBOL;
      }
      return dv.collapseText;
    });

    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }

  // ########################################################

  // Redraw for zoom
  function redraw() {
    // console.log("here", d3.event.translate, d3.event.scale);
    svg.attr('transform',
      `translate(${d3.event.translate})`
        + ` scale(${d3.event.scale})`);
  }

  // #############################   Function Area #######################
  function wrap(text, width) {
    text.each(function () {
      const text = d3.select(this);
      const words = text.text().split().reverse();
      let word;
      let line = [];
      let lineNumber = 0;
      const lineHeight = 1.1; // ems
      const x = text.attr('x');
      const y = text.attr('y');
      const dy = 0; // parseFloat(text.attr("dy")),
      let tspan = text.text(null)
        .append('tspan')
        .attr('x', x)
        .attr('y', y)
        .attr('dy', `${dy}em`);
      while (word = words.pop()) {
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
  }

  function addPropertyRecursive(propertyName, propertyValueFunction, element) {
    if (element[propertyName]) {
      element[propertyName] = `${element[propertyName]} ${propertyValueFunction(element)}`;
    } else {
      element[propertyName] = propertyValueFunction(element);
    }
    if (element.children) {
      element.children.forEach((v) => {
        addPropertyRecursive(propertyName, propertyValueFunction, v);
      });
    }
    if (element._children) {
      element._children.forEach((v) => {
        addPropertyRecursive(propertyName, propertyValueFunction, v);
      });
    }
  }

  function listen() {
    const input = get('.user-search-box .search-input');

    input.addEventListener('input', () => {
      const value = input.value ? input.value.trim() : '';
      if (value.length < 3) {
        params.funcs.clearResult();
      } else {
        const searchResult = params.funcs.findInTree(params.data, value);
        params.funcs.reflectResults(searchResult);
      }
    });
  }

  function expand(d) {
    if (d.children) {
      d.children.forEach(expand);
    }

    if (d._children) {
      d.children = d._children;
      d.children.forEach(expand);
      d._children = null;
    }

    if (d.children) {
      // if node has children and it's expanded, then  display -
      setToggleSymbol(d, attrs.COLLAPSE_SYMBOL);
    }
  }

  function collapse(d) {
    if (d._children) {
      d._children.forEach(collapse);
    }
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }

    if (d._children) {
      // if node has children and it's collapsed, then  display +
      setToggleSymbol(d, attrs.EXPAND_SYMBOL);
    }
  }

  function setCollapsibleSymbolProperty(d) {
    if (d._children) {
      d.collapseText = attrs.EXPAND_SYMBOL;
    } else if (d.children) {
      d.collapseText = attrs.COLLAPSE_SYMBOL;
    }
  }

  function setToggleSymbol(d, symbol) {
    d.collapseText = symbol;
    d3.select(`*[data-id='${d.uniqueIdentifier}']`).select('text').text(symbol);
  }

  function get(selector) {
    return document.querySelector(selector);
  }
}
