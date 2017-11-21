// set width, height to either a 
// absolute value or the window attributes
var width = Math.max(960, window.innerWidth),
	height = Math.max(500, window.innerHeight);

// set pi and tau
var pi = Math.PI;
	tau = 2 * pi;

// create map projection setting
var projection = d3.geoMercator()
	.scale(1 / tau) // set scale
	.translate([0, 0]);

// create path generator
var path = d3.geoPath()
	.projection(projection); // set projection to created projection

// set up tile according to width and height
var tile = d3.tile()
	.size([width, height]);

// set d3 zoom
var zoom = d3.zoom()
	.scaleExtent([
		1 << 11,  // bitwise operator
		1 << 24
	])
	.on('zoom', zoomed); // set mouse on event listener

// create radius scale
var radius = d3.scaleSqrt().range([0, 10]);

// create svg element
var svg = d3.select('body')
	.append('svg')
	.attr('width', width)
	.attr('height', height);

// create raster
var raster = svg.append('g');

// create vector draw a single path element
// var vector = svg.append('path');
var vector = svg.selectAll('path');

// load data
d3.json('data/earthquakes_4326_cali.geojson', function(error, geojson) {
	if (error) throw error;

	console.log(geojson);

	// set up radius scale domain
	radius.domain([0, d3.max(geojson.features, function(d) { return d.properties.mag; })]);
	
	// sets the radius used to display Point geometries to mag. 
	path.pointRadius(function(d) {
		return radius(d.properties.mag);
	});

	// bind vector data
	// vector = vector.datum(geojson);
	
	// alternative way to bind data so we don't highlight whole path together
	vector = vector.data(geojson.features)
					.enter().append('path')
					.attr('d', path)
					.on('mouseover', function(d) { console.log(d); });

	// set map projection to center of California
	var center = projection([-119.66, 37.414])

	// call zoom transform on svg element
	svg.call(zoom)
		.call(
			zoom.transform,
			d3.zoomIdentity
				.translate(width / 2, height / 2)
				.scale(1 << 14)
				.translate(-center[0], -center[1])
		);
});


function zoomed() {
	var transform = d3.event.transform;

	var tiles = tile
		.scale(transform.k)
		.translate([transform.x, transform.y])
		();

	console.log(transform.x, transform.y, transform.k);

	// set projection scale
	projection
		.scale(transform.k / tau)
		.translate([transform.x, transform.y]);

	// draw the vector
	vector.attr('d', path);

	// set image
	var image = raster
		.attr('transform', stringify(tiles.scale, tiles.translate))
		.selectAll('image')
		.data(tiles, function(d) { return d; });

	// remove unnecessary
	image.exit().remove();

	// put images on and set attributes
	image.enter().append('image')
		.attr('xlink:href', function(d) {
			// return url to the image
			return 'http://' + 'abc'[d[1] % 3] + '.basemaps.cartocdn.com/rastertiles/voyager/' + 
				d[2] + "/" + d[0] + "/" + d[1] + ".png";
		})
		.attr('x', function(d) { return d[0] * 256; })
		.attr('y', function(d) { return d[1] * 256; })
		.attr('width', 256)
		.attr('height', 256);
}

// create stringify function to generate corresponding string
function stringify(scale, translate) {
	var k = scale / 256,
		r = scale % 1 ? Number : Math.round;

	return `translate(${r(translate[0] * scale)}, ${r(translate[1] * scale)}) scale(${k})`;
}

