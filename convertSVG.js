/****
 *
 * This script is called from Node.js to process a SVG floorplan into:
 * 1) a high-res PNG that will be used as a background image
 * 2) a new SVG that will contain only overlay/interactive features:
 *      a) interior spaces
 *      b) labels
 *
 * It uses D3.js to process the SVG DOM and PhantomJS to render PNGs
 *
 * In the future it can be parameterized and turned into a web service
 * in order to dynamically change the background image.
 * We may also look into using something like Mapnik or TileStache to
 * split the high-res into tiles for improved performance
 *
 *
 * Note: I had to pull down this fork of the phantomjs-node module
 * https://github.com/sebv/phantomjs-node
 *
 */

'use strict';

var PNGPath = '/app/media/png/',
	SVGPath = '/app/media/svg/';


var ConvertSVG = function (filename) {
	this.filename = filename;
};

ConvertSVG.prototype = {
	filename: null,

	/**
	 * Create PNG
	 * @param fileSource
	 * @param fileTarget
	 * @param width
	 * @param height
	 * @param resolutionMultiplier
 * @param tileTarget
	 */
	createPNG: function (fileSource, fileTarget, tileTarget, width, height, resolutionMultiplier) {
		//setup phantomJS to render PNG
		var phantom = require('phantom');
		phantom.create(function (ph) {
			return ph.createPage(function (page) {
				//set page dimensions
				var pageWidth = width * resolutionMultiplier,
					pageHeight = height * resolutionMultiplier;
				page.set('viewportSize', {width: pageWidth, height: pageHeight});
				console.log("PNG Dimensions Width:" + pageWidth + " Height:" + pageHeight);

				return page.open(fileSource, function (status) {
					if (status !== 'success') {
						console.log('Unable to load: ' + fileSource);
						ph.exit();
					} else {
						page.render(fileTarget);
						console.log('Render Complete!');
						ph.exit();

						var gm = require('gm'),
							fs = require('fs'),

							cropHeight =   pageHeight / 2,
							cropWidth =   pageWidth / 2;


						//upperLeft
						gm(fileTarget).crop(cropWidth, cropHeight, 0, 0)
							.background('white')
							.flatten()
							.matteColor('white')
							.write(tileTarget + "-bg-ul.jpg", function (err) {
								if (!err) {
									console.log(' Saved ul tile ');
								} else {
									console.log(err);
								}
							});

						//lowerLeft
						gm(fileTarget).crop(cropWidth, cropHeight, 0, cropHeight)
							.background('white')
							.flatten()
							.matteColor('white')
							.write(tileTarget + "-bg-ll.jpg", function (err) {
								if (!err) {
									console.log(' Saved ll tile ');
								} else {
									console.log(err);
								}
							});

						//upperRight
						gm(fileTarget).crop(cropWidth, cropHeight, cropWidth, 0)
							.background('white')
							.flatten()
							.matteColor('white')
							.write(tileTarget + "-bg-ur.jpg", function (err) {
								if (!err) {
									console.log(' Saved ur tile ');
								} else {
									console.log(err);
								}
							});

						//lowerRight
						gm(fileTarget).crop(cropWidth, cropHeight, cropWidth, cropHeight)
							.background('white')
							.flatten()
							.matteColor('white')
							.write(tileTarget + "-bg-lr.jpg", function (err) {
								if (!err) {
									console.log(' Saved lr tile ');
								} else {
									console.log(err);
								}
							});



					}
				});
			});
		});
	},

	/**
	 * Write data to file
	 * @param data
	 * @param fileTarget
	 */
	writeFile: function (data, fileTarget) {
		var fs = require('fs');
		//write  to file
		fs.writeFileSync(fileTarget, data);

	},

	//Not using any of this stuff for now
	/*mapValue: function (value, minTo, maxTo, minFrom, maxFrom) {
		return minTo + (maxTo - minTo) * ((value - minFrom) / (maxFrom - minFrom));
	},

	projectCADToLatLng: function (latlng, minX, minY, maxX, maxY) {
		var targetMinX = -10.0,
			targetMinY = -5.0,
			targetMaxX = 10.0,
			targetMaxY = 5.0,

			mappedLat = this.mapValue(latlng.lat, targetMinY, targetMaxY, minY, maxY),
			mappedLng = this.mapValue(latlng.lng, targetMinX, targetMaxX, minX, maxX);

		return {lat: mappedLat, lng: mappedLng};

	},

	createGDALTranslateCall: function (viewBox, target) {
		//gdal_translate -of GTiff -a_ullr ullat ullon lrlat lelon  -a_srs EPSG:4269 input.tif output.tif
									//       ulx uly lrx lry
		var ullaty =  Number(viewBox.yMin) + Number(viewBox.height),
			ullonx = viewBox.xMin,
			lrlaty = viewBox.yMin,
			lrlonx = Number(viewBox.xMin) + Number(viewBox.width),

			ul = this.projectCADToLatLng({lat: ullaty, lng: ullonx}, ullonx, lrlaty, lrlonx, ullaty),
			lr = this.projectCADToLatLng({lat: lrlaty, lng: lrlonx}, ullonx, lrlaty, lrlonx, ullaty),

			output = "gdal_translate -of GTiff -a_ullr " +
				ul.lng.toString() + " " + ul.lat.toString() + " " + lr.lng.toString() + " " + lr.lat.toString() +
				" -a_srs EPSG:4326 " + target + " " + target;

		return output;


	},*/

	/**
	 * Convert
	 */
	convert: function () {

		global.document = require("jsdom").jsdom("<html><body></body></html>");
		global.window = global.document.createWindow();

		var fs = require('fs'),
			ofp = require('openfloorplan'),

			source =  __dirname + SVGPath + this.filename + '.svg',
			backgroundTarget =  __dirname + PNGPath + this.filename + '-bg.png',
			tileTarget =  __dirname + PNGPath + this.filename,
			overlayTarget =  __dirname + SVGPath + this.filename + '-ol.svg',
			resolutionMultiplier =  15,
			convertSVG = this; //need a local scope reference;

		console.log("File: " + backgroundTarget);

		/////////////
		//Overlay
		/////////////
		fs.readFile(source, function (err, data) {
			if (err) {
				throw err;
			}

			var fp, viewBox;

			console.log("loaded SVG file");

			//set body as the SVG data
			global.document.body.innerHTML = data;
			//get the floorplan
			fp = new ofp.FloorPlan(global.document.body);

			//flag everything for removal
			fp.svg.selectAll('g [type=level]').classed('tmp-removed', true);
			//un-flag the stuff we want to keep
			fp.spaces.layer.classed('tmp-removed', false);
			fp.dimensionAnnotations.layer.classed('tmp-removed', false);

			//remove everything else
			fp.svg.selectAll('.tmp-removed').remove();

			convertSVG.writeFile(fp.exportSVG(), overlayTarget);

		});

		//////////////////
		//Background
		/////////////////
		//read the source SVG file
		fs.readFile(source, function (err, data) {
			if (err) {
				throw err;
			}

			var fp, viewBox;

			console.log("loaded SVG file");

			//set body as the SVG data
			global.document.body.innerHTML = data;
			//get the floorplan
			fp = new ofp.FloorPlan(global.document.body);

			viewBox = fp.getViewBox();

			fp.dimensionAnnotations.remove();



			convertSVG.writeFile(fp.exportSVG(), "temp.svg");

			convertSVG.createPNG("temp.svg", backgroundTarget, tileTarget, viewBox.width, viewBox.height, resolutionMultiplier);

		});


	}

};



//run it
new ConvertSVG("fs-hi200-01").convert();






