# OpenFloorPlan Viewer

View and Interact with SVG Floorplans using HTML5


## Development

Requirements:

 - NodeJS
 - Yeoman (including Bower and Grunt) https://github.com/yeoman/yeoman/wiki/Getting-Started


```
npm install -g yo
npm install -g grunt-cli
npm install -g bower
```


Install using:

```
git clone https://github.com/openfloorplan/ofp-viewer.git
cd ofp-viewer
npm install
bower install
```

Angular Bootstrap needs to be built seperately

```
cd app/components/angular-ui-bootstrap
npm install
grunt
grunt build
```


Return to root directory and run server with:

    cd ../../..
    grunt server

This code currently referencing a missing app/media folder that contains floorplans we use for demos.
We are working on replacing the demos with data that we can share as part of the project.
In the mean time, you will need to reconfigure it to use your own floorplans.

## Demo Data

This project uses SVG data converted from CAD floorplans such as this example http://www.physics.ohio-state.edu/fac_engr/flr_plans.html

(It isn't easy to find good public CAD data, they deserve credit for publishing their CAD files online.)

You will need to convert the DWG files into SVG using something like GDAL ogr2ogr http://www.gdal.org/drv_cad.html


## Setting up Your Own Floor Plans

###Requirements:

* The spaces in your floorplan need to be drawn as polygons.
* Polygons need to grouped using the SVG <g> tag and each group should have a unique ID

###Here is an example:

```
<g type="level" id="bgspa_space_area_b">
<polygon fill="none" points="-2876.47,3737.76 -2868.47,3737.76 -2868.47,3747.75 -2876.47,3747.75 " stroke="rgb(0,0,0)" class="unhl"  pointer-events="all" id="e0-01s" entity="101" mslink="4312" />
<polygon fill="none" points="-2783.20,3737.76 -2771.12,3737.76 -2771.12,3762.84 -2783.20,3762.84 " stroke="rgb(0,0,0)" class="unhl"  pointer-events="all" id="e1-01s" entity="101" mslink="4326" />
</g> 
```

Update floorplan.js to point to the layer in your floorplan that contains spaces. 

https://github.com/openfloorplan/ofp-viewer/blob/master/app/scripts/controllers/floorplan.js

Specifically you will need to configure a layer type for each group of polygons you want to be interactive. You can see the code for LayerType here: https://github.com/openfloorplan/ofp.js/blob/master/src/core/layerType.js but the inputs are:

```
ofp.LayerType('MyName', ‘my-class-name', [‘d3 selector string']);
```

The first argument is just a name you pick, the second is a class name you also pick that is injected into the SVG to simplify future interactions (e.g. applying style changes with a class), then last one is the important one. That is a D3.js selector (similar to JQuery selectors) that selects the the SVG group tag (<g>) that has that id. 

----------------


## License

OpenFloorPlan Viewer (ofp-viewer) is released under the MIT license, see LICENSE file.

