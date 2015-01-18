L.CRS.Simple2 = L.extend({}, L.CRS, {
    projection: L.Projection.LonLat,
    transformation: new L.Transformation(1, 0, -1, 0),

    scale: function (zoom) {
        return Math.pow(2, zoom);
    }
});

floorplanApp.controller('FloorplanCtrl', function ($scope) {
    'use strict';


    $scope.fileSVGPath = "/svg/";
    $scope.filePNGPath = "/png/";

    $scope.fileExt = ".svg";
    $scope.fileOL = "-ol.svg";
    $scope.fileBGUL = "-bg-ul.jpg";
    $scope.fileBGLL = "-bg-ll.jpg";
    $scope.fileBGUR = "-bg-ur.jpg";
    $scope.fileBGLR = "-bg-lr.jpg";

    //Create layer types for SYNCADD floorplans
    $scope.layerTypes = {};
    $scope.layerTypes.spaces = new ofp.LayerType('Space', 'ofp-space', ['#bgspa_space_area_b']);
    $scope.layerTypes.columns = new ofp.LayerType('Column', 'ofp-column', ['#Column', '#bgspa_column_area_b']);
    $scope.layerTypes.constructions = new ofp.LayerType('Construction', 'ofp-construction', ['#Constructions', '#Frames']);
    $scope.layerTypes.dimensionAnnotations = new ofp.LayerType('Dimension Annotations', 'ofp-annotations-dimensions',  ['#Dimension', '#A-ANNO-DIMS']);

    $scope.floorplanList = [
        {
            name: "065-01",
            path: "media/public",
            desc: ""
        },
        {
            name: "example2",
            path: "media/internal",
            desc: "auto-detect layer example"
        },
        {
            name: "fs-hi200-01",
            path: "media/internal",
            desc: "",
            useTiles: false,
            layerTypes: $scope.layerTypes
        },
        {
            name: "fd1-01",
            path: "media/internal",
            desc: "large example",
            useTiles: true,
            layerTypes: $scope.layerTypes
        },
        {
            name: "cz-ja101-01",
            path: "media/internal",
            desc: "",
            useTiles: true,
            layerTypes: $scope.layerTypes
        }
    ];

    $scope.defaultFloorplan = "065-01";

    //Need a custom CRS so we can set the pixel ratio
    L.CRS.NonProjectedFloorPlan = L.extend({}, L.CRS, {
        projection: L.Projection.LonLat,
        transformation: new L.Transformation(1, 0, -1, 0),

        scaleMult: null,
        scale: function (zoom) {
            if (this.scaleMult) {
                return Math.pow(2, zoom) * this.scaleMult;
            } else {
                return Math.pow(2, zoom);
            }

        },
        setScaleMult: function (scaleMultiplier) {
            this.scaleMult = scaleMultiplier;
        }
    });



    $scope.map = new L.Map('map', {
        crs: L.CRS.Simple2,
        center: [0.0, 0.0],
        worldCopyJump: false
    });

    $scope.map.attributionControl.addAttribution('&copy; SYNCADD Systems, Inc. - Public Demo Data from <a href="http://www.physics.ohio-state.edu/fac_engr/flr_plans.htm">http://www.physics.ohio-state.edu/fac_engr/flr_plans.htm</a>');

    $scope.loadFloorPlan = function (name) {

        var i, file, floorPlan;

        for (i = 0; i < $scope.floorplanList.length; i++) {
            if ($scope.floorplanList[i].name == name) {
                floorPlan = $scope.floorplanList[i];
            }
        }

        file = floorPlan.path + $scope.fileSVGPath + name;


        //file = $scope.fileSVGPath + name;
        if (floorPlan.useTiles) {
            file = file + $scope.fileOL;
        } else {
            file = file + $scope.fileExt;
        }
        d3.html(file, function (data) {

            var svg, viewBox, overlayPane, layerTypes;

            overlayPane = d3.select($scope.map.getPanes().markerPane); //attaching to Leaflets marker pane

            overlayPane.node().appendChild(data); //append the svg

            svg = d3.select("svg");

            //initialize the floor plan
            $scope.fp = new ofp.FloorPlan(overlayPane.node(), floorPlan.layerTypes);

            viewBox = $scope.fp.getViewBox();

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
                urBounds = new L.LatLngBounds(center, northEast),
                xRatio = 1,
                yRatio = 1;

            //calculate pixel ratio of the floorplan to the current browser container
            var mapSize = $scope.map.getSize();

            if (mapSize.x < viewBox.width || mapSize.y < viewBox.height){
                xRatio = (viewBox.width / mapSize.x) / 100;
                yRatio = (viewBox.height / mapSize.y) / 100;
                if (xRatio > yRatio) {
                    L.CRS.NonProjectedFloorPlan.setScaleMult(xRatio);
                } else {
                    L.CRS.NonProjectedFloorPlan.setScaleMult(yRatio);
                }
            }

            console.log(viewBox);

            //add background layers
            if (floorPlan.useTiles) {
                $scope.backgroundLayerGroup = L.layerGroup([
                    L.imageOverlay(floorPlan.path + $scope.filePNGPath + name + $scope.fileBGLL, llBounds),
                    L.imageOverlay(floorPlan.path + $scope.filePNGPath + name + $scope.fileBGUL, ulBounds),
                    L.imageOverlay(floorPlan.path + $scope.filePNGPath + name + $scope.fileBGLR, lrBounds),
                    L.imageOverlay(floorPlan.path + $scope.filePNGPath + name + $scope.fileBGUR, urBounds)
                ]).addTo($scope.map);

                $scope.backgroundLayerGroup.eachLayer(function (layer) {
                    //layer.bringToBack();
                });
            }

            //set map bounds
            //$scope.map.setMaxBounds(bounds);
            $scope.map.fitBounds(bounds);
            var mapBounds  = $scope.map.getBounds();
            var boundsZoom = $scope.map.getBoundsZoom(bounds, true);
            svg.classed('leaflet-zoom-hide', true);


            var spaces = null;

            if ($scope.fp.spaces) {
                spaces = $scope.fp.spaces;
            }else if ($scope.fp.NET) {
                spaces = $scope.fp.NET;
            }

            if (spaces) {
                //Mouse hover on spaces
                spaces.elements.on("mouseover",
                    function (d, i) {

                        if ($scope.spaceUseDemo) { return; }

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

                    });

                spaces.elements.on("mouseout",
                    function (d, i) {

                        if ($scope.spaceUseDemo) { return; }

                        d3.select(this).transition().duration(300).style('fill', 'none');
                        //$(this).popover('hide');
                        $scope.$apply(function () {
                            $scope.hoverStatus = "";
                        });
                    });

                spaces.elements.on("click",
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
                            .x(function (d) {
                                return d[0];
                            })
                            .y(function (d) {
                                return d[1];
                            })
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

                    });
            }

            // Use Leaflet to implement a D3 geographic projection.
            function project(val) {
                var point = $scope.map.latLngToLayerPoint(new L.LatLng(val.lat, val.lng));
                //var point = $scope.map.project(new L.LatLng(val.lat, val.lng));
                //var point = $scope.map.latLngToContainerPoint(new L.LatLng(val.lat, val.lng));
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
            if ($scope.backgroundLayerGroup) {
                $scope.backgroundLayerGroup.clearLayers();
            }
            $scope.loadFloorPlan(this.floorPlanSelection);
        }

    };
    $scope.loadFloorPlan($scope.defaultFloorplan);

    var clearModal = function () {
        $scope.modalShown = false;
        d3.select('#modal-space-view').select('svg').remove();
    };

    $scope.onModalCancel = function () {
        clearModal();
    };

    $scope.onModalSave = function () {
        clearModal();
    };

    $scope.onSpaceUseDemo = function () {
        var spaces = $scope.fp.spaces.layer.selectAll('polygon');
        if ($scope.spaceUseDemo) {

            spaces.each(function () {
                var rand = Math.floor((Math.random() * 3 ) + 1);
                var color = 'blue';
                if (rand === 1) {
                    color = 'red';
                } else if (rand === 2) {
                    color = 'green';
                }

                d3.select(this).style('fill', 'white');
                d3.select(this).transition().duration(300).style('fill', color);
            });


        } else {
            //turn off the demo
            spaces.transition().duration(300).style('fill', 'none');
        }
    }


});
