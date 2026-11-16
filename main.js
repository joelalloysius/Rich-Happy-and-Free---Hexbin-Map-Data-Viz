// =====================================================
// 1. Canvas: LinkedIn 4:5 portrait, 1080 x 1350
// =====================================================
const svg = d3.select("#frame")
  .append("svg")
  .attr("viewBox", "0 0 1080 1350")
  .attr("width", "100%");

svg.append("rect")
  .attr("class", "background")
  .attr("width", 1080)
  .attr("height", 1350);


// =====================================================
// 2. Title and subtitle
// =====================================================
svg.append("text")
  .attr("class", "title")
  .attr("x", 60)
  .attr("y", 122)
  .text("Rich, Happy and Free?");

svg.append("text")
  .attr("class", "subtitle")
  .attr("x", 60)
  .attr("y", 172)
  .text("Europe's countries on development, happiness and freedom");


// =====================================================
// 3. Legend
// =====================================================
function addLegendItem(x, className, label) {
  svg.append("rect")
    .attr("class", className)
    .attr("x", x)
    .attr("y", 204)
    .attr("width", 18)
    .attr("height", 18)
    .attr("rx", 3);

  svg.append("text")
    .attr("class", "legend-label")
    .attr("x", x + 28)
    .attr("y", 220)
    .text(label);
}

addLegendItem(60, "hdi", "Development (HDI)");
addLegendItem(330, "happy", "Happiness");
addLegendItem(510, "free", "Freedom");


// =====================================================
// 4. Panel (Europe averages, or a country on hover)
// =====================================================
svg.append("rect")
  .attr("class", "panel")
  .attr("x", 60)
  .attr("y", 254)
  .attr("width", 960)
  .attr("height", 170)
  .attr("rx", 18);

svg.append("text")
  .attr("class", "panel-name")
  .attr("id", "panel-name")
  .attr("x", 88)
  .attr("y", 310)
  .text("Europe");

function addPanelSlot(x, className, label, numberId) {
  svg.append("rect")
    .attr("class", className)
    .attr("x", x)
    .attr("y", 338)
    .attr("width", 5)
    .attr("height", 66);

  svg.append("text")
    .attr("class", "panel-label")
    .attr("x", x + 18)
    .attr("y", 356)
    .text(label);

  svg.append("text")
    .attr("class", "panel-number")
    .attr("id", numberId)
    .attr("x", x + 18)
    .attr("y", 398)
    .text("–");
}

addPanelSlot(88, "hdi", "Development (HDI)", "hdi-number");
addPanelSlot(389, "happy", "Happiness", "happy-number");
addPanelSlot(690, "free", "Freedom", "free-number");

function formatNumber(value, decimals) {
  if (value === null) {
    return "–";
  }
  return value.toFixed(decimals);
}

function showInPanel(name, hdi, happiness, freedom) {
  d3.select("#panel-name").text(name);
  d3.select("#hdi-number").text(formatNumber(hdi, 3));
  d3.select("#happy-number").text(formatNumber(happiness, 2));
  d3.select("#free-number").text(formatNumber(freedom, 0));
}


// =====================================================
// 5. Sources line at the bottom
// =====================================================
svg.append("text")
  .attr("class", "source")
  .attr("x", 60)
  .attr("y", 1314)
  .text("Sources: UNDP Human Development Report 2025 · World Happiness Report 2026 · Freedom House");


// =====================================================
// 6. Helpers: data, positions and column heights
// =====================================================
function toNumber(text) {
  if (text === "") {
    return null;
  }
  return Number(text);
}

// grid position (col, row) -> canvas position (x, y)
function xPosition(d) {
  let x = 140 + d.col * 94;
  if (d.row % 2 === 1) {
    x = x + 47;   // shift odd rows half a step to make the honeycomb
  }
  return x;
}

function yPosition(d) {
  return 510 + d.row * 81;
}

// scores -> column heights (0 to 43 pixels)
const hdiScale = d3.scaleLinear()
  .domain([0.75, 1])
  .range([0, 43])
  .clamp(true);

const happyScale = d3.scaleLinear()
  .domain([4.5, 8])
  .range([0, 43])
  .clamp(true);

const freeScale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, 43])
  .clamp(true);

function hdiHeight(d) {
  if (d.hdi === null) {
    return 0;
  }
  return hdiScale(d.hdi);
}

function happyHeight(d) {
  if (d.happiness === null) {
    return 0;
  }
  return happyScale(d.happiness);
}

function freeHeight(d) {
  if (d.freedom === null) {
    return 0;
  }
  return freeScale(d.freedom);
}


// =====================================================
// 7. Load the data and draw the map
// =====================================================
d3.csv("data.csv").then(function (data) {

  // text -> numbers (empty cells become null)
  data.forEach(function (d) {
    d.hdi = toNumber(d.hdi);
    d.happiness = toNumber(d.happiness);
    d.freedom = toNumber(d.freedom);
    d.col = Number(d.col);
    d.row = Number(d.row);
  });

  // Europe averages (d3.mean skips missing values)
  const avgHdi = d3.mean(data, function (d) { return d.hdi; });
  const avgHappiness = d3.mean(data, function (d) { return d.happiness; });
  const avgFreedom = d3.mean(data, function (d) { return d.freedom; });

  showInPanel("Europe", avgHdi, avgHappiness, avgFreedom);

  // one group per country, moved to its place on the grid
  const countries = svg.selectAll(".country")
    .data(data)
    .join("g")
    .attr("class", "country")
    .attr("transform", function (d) {
      return "translate(" + xPosition(d) + "," + yPosition(d) + ")";
    });

  // hexagon
  countries.append("polygon")
    .attr("class", "tile")
    .attr("points", "0,-51 44,-25 44,25 0,51 -44,25 -44,-25");

  // country code
  countries.append("text")
    .attr("class", "code")
    .attr("y", -27)
    .text(function (d) {
      return d.code;
    });

  // development column
  countries.append("rect")
    .attr("class", "hdi")
    .attr("x", -25)
    .attr("width", 14)
    .attr("rx", 3)
    .attr("height", hdiHeight)
    .attr("y", function (d) {
      return 27 - hdiHeight(d);
    });

  // happiness column
  countries.append("rect")
    .attr("class", "happy")
    .attr("x", -7)
    .attr("width", 14)
    .attr("rx", 3)
    .attr("height", happyHeight)
    .attr("y", function (d) {
      return 27 - happyHeight(d);
    });

  // freedom column
  countries.append("rect")
    .attr("class", "free")
    .attr("x", 11)
    .attr("width", 14)
    .attr("rx", 3)
    .attr("height", freeHeight)
    .attr("y", function (d) {
      return 27 - freeHeight(d);
    });

  // baseline under the columns
  countries.append("line")
    .attr("class", "baseline")
    .attr("x1", -29)
    .attr("x2", 29)
    .attr("y1", 27)
    .attr("y2", 27);

  // ---------- Hover ----------
  // pointer moves onto a country: outline it and show its numbers
  countries.on("mouseenter", function (event, d) {
    d3.select(this).classed("active", true);
    showInPanel(d.name, d.hdi, d.happiness, d.freedom);
  });

  // pointer leaves: remove the outline and go back to Europe
  countries.on("mouseleave", function () {
    d3.select(this).classed("active", false);
    showInPanel("Europe", avgHdi, avgHappiness, avgFreedom);
  });
});