floorplanApp.controller('FloorplanCtrl', function ($scope) {
	'use strict';

	$scope.fileSVGPath = "./media/svg/";
	$scope.filePNGPath = "./media/png/";

	$scope.fileOL = "-ol.svg";
	$scope.fileBGUL = "-bg-ul.jpg";
	$scope.fileBGLL = "-bg-ll.jpg";
	$scope.fileBGUR = "-bg-ur.jpg";
	$scope.fileBGLR = "-bg-lr.jpg";

	$scope.floorplanList = [
		{
			name: "fd1-01",
			desc: ""
		},
		{
			name: "cz-ja101-01",
			desc: ""
		},
		{
			name: "fs-hi200-01",
			desc: ""
		}
	];

	$scope.defaultFloorplan = "fs-hi200-01";

	$scope.map = new L.Map('map', {
		crs: L.CRS.Simple,
		center: [0.0, 0.0],
		worldCopyJump: false
	});

	$scope.map.attributionControl.addAttribution("&copy; SYNCADD Systems, Inc.");

	$scope.loadFloorPlan = function (name) {

		d3.html($scope.fileSVGPath + name + $scope.fileOL, function (data) {

			var svg, fp, viewBox, overlayPane;

			overlayPane = d3.select($scope.map.getPanes().markerPane); //attaching to Leaflets marker pane

			overlayPane.node().appendChild(data); //append the svg

			svg = d3.select("svg");

			//initialize the floor plan
			fp = new ofp.FloorPlan(overlayPane.node());

			viewBox = fp.getViewBox();

			var minX = viewBox.x,
				minY = viewBox.y,
				maxX = viewBox.x + viewBox.width,
				maxY = viewBox.y + viewBox.height,
				centerX = viewBox.x + (viewBox.width / 2),
				centerY = viewBox.y + (viewBox.height / 2),

				southWest = new L.LatLng(minY, minX),
				northEast = new L.LatLng(maxY, maxX),
				bounds = new L.LatLngBounds(southWest, northEast),
				center = new L.LatLng(centerY, centerX),
				llBounds = new L.LatLngBounds(southWest, center),
				ulBounds = new L.LatLngBounds(new L.LatLng(centerY, minX), new L.LatLng(maxY, centerX)),
				lrBounds = new L.LatLngBounds(new L.LatLng(minY, centerX), new L.LatLng(centerY, maxX)),
				urBounds = new L.LatLngBounds(center, northEast);

			console.log(viewBox);

			//add background layers
			$scope.backgroundLayerGroup = L.layerGroup([
				L.imageOverlay($scope.filePNGPath + name + $scope.fileBGLL, llBounds),
				L.imageOverlay($scope.filePNGPath + name + $scope.fileBGUL, ulBounds),
				L.imageOverlay($scope.filePNGPath + name + $scope.fileBGLR, lrBounds),
				L.imageOverlay($scope.filePNGPath + name + $scope.fileBGUR, urBounds)
			]).addTo($scope.map);

            $scope.backgroundLayerGroup.eachLayer(function (layer) {
                layer.bringToBack();
            });


			//set map bounds
			$scope.map.fitBounds(bounds);
			svg.classed('leaflet-zoom-hide', true);


			//Mouse hover on spaces
			fp.spaces.elements.on("mouseover",
				function (d, i) {
					var element = d3.select(this);
					element.style('fill', 'white');
					element.transition().duration(300).style('fill', 'red');

					element.attr("title", this.id);
					element.attr("ui-jq", "tooltip");

					$scope.$apply(function () {
						$scope.hoverStatus = element.attr('id');
					});

					//$(this).tooltip({content: this.id, trigger: 'manual', title: this.id, html:true, animation: true, displayTarget: $('#floorplan')});
					//$(this).popover({content: this.id, trigger: 'manual', title: this.id, html:true, animation: true});
					//$(this).popover('show');


				}
				);

			fp.spaces.elements.on("mouseout",
				function (d, i) {
					d3.select(this).transition().duration(300).style('fill', 'none');
					//$(this).popover('hide');
					$scope.$apply(function () {
						$scope.hoverStatus = "";
					});
				}
				);

			fp.spaces.elements.on("click",
				function (d, i) {
					var element, node, space, modalSVG, modalG, bbox, xMin, yMin, viewBoxStr;

					element = d3.select(this);
					$scope.$apply(function () {
						$scope.modalShown = true;
						$scope.selectedSpaceID = element.attr('id');
					});


					//clone the space
					node = d3.select(this).node();
					space = d3.select(node.parentNode.insertBefore(node.cloneNode(true), node.nextSibling));
					modalSVG = d3.select('#modal-space-view')
						.append('svg');
					modalG = modalSVG.append('g');
						//.attr("width", "100%")
						//.attr("height", "100%");
					$(modalG[0][0])
						.append(space[0][0]);

					/*modalSVG.append('svg:path')
						.attr('d', line(shapeCoords) + 'Z')
						.style('stroke-width', 1)
						.style('stroke', 'steelblue')
						.style('fill', 'rgba(120, 220, 54, 0.2)');*/

					bbox = space[0][0].getBBox();

					xMin = bbox.x.toString();
					yMin = bbox.y.toString();

					viewBoxStr = xMin + " " + yMin + " " + bbox.width.toString() + " " + bbox.height.toString();

					//modalSVG.attr("transform", "translate(790,-475)");
					modalSVG.attr("viewBox", viewBoxStr);


					// Draw Lines

					var line = d3.svg.line()
						.x(function(d) { return d[0]; })
						.y(function(d) { return d[1]; })
						.interpolate('linear');

					var lineData = [];

					var redrawLine = function () {
						var svgLines = modalG.selectAll('path.my-lines')
							.data(lineData)
							.remove();


						svgLines.enter()
							.append('path')
							.attr('d', line(lineData))
							.attr('class', 'my-lines')
							.attr('stroke', 'steelblue')
							.attr('stroke-width', 1);

						svgLines.exit()
							.remove();

						//console.debug("lineData", lineData);
					};

					var mouseIsDown = false;
					//$('#modal-space-view')
					//d3.select('#modal-space-view').select('svg')

					modalSVG.on('mousedown', function () {
						mouseIsDown = true;
						lineData[0] = d3.mouse(modalSVG[0][0]);
						redrawLine();
					});
					modalSVG.on('mouseup', function () {
						mouseIsDown = false;
						lineData[1] = d3.mouse(modalSVG[0][0]);
						redrawLine();
					});
					modalSVG.on('mousemove', function () {
						if (mouseIsDown) {
							lineData[1] = d3.mouse(modalSVG[0][0]);
							redrawLine();
						}
					});

				}
				);


			// Use Leaflet to implement a D3 geographic projection.
			function project(val) {
				var point = $scope.map.latLngToLayerPoint(new L.LatLng(val.lat, val.lng));
				return [point.x, point.y];
			}

			// Reposition the SVG to cover the features.
			function reset() {
				var bottomLeft = project(bounds.getSouthWest()),
					topRight = project(bounds.getNorthEast());

				svg.attr("width", topRight[0] - bottomLeft[0])
					.attr("height", bottomLeft[1] - topRight[1])
					.style("margin-left", bottomLeft[0] + "px")
					.style("margin-top", topRight[1] + "px");
			}

			reset();
			$scope.map.on("viewreset", reset);



		});
	}; //end load floorplan

	$scope.onFloorPlanSelect = function () {
		if (this.floorPlanSelection !== "") {
			d3.select($scope.map.getPanes().markerPane).select("svg").remove();
			if($scope.backgroundLayerGroup){
                $scope.backgroundLayerGroup.clearLayers();
            }
			$scope.loadFloorPlan(this.floorPlanSelection);
		}

	};
	$scope.loadFloorPlan($scope.defaultFloorplan);

	var clearModal = function() {
		$scope.modalShown = false;
		d3.select('#modal-space-view').select('svg').remove();
	};

	$scope.onModalCancel = function () {
		clearModal();
	};

	$scope.onModalSave = function () {
		clearModal();
	};


});
