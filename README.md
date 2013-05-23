# OpenFloorPlan Viewer

View and Interact with SVG Floorplans using HTML5


## Development

Requirements:

 - NodeJS
 - Yeoman (including Bower and Grunt) https://github.com/yeoman/yeoman/wiki/Getting-Started

Install using:

    git clone https://github.com/openfloorplan/ofp-viewer.git
    cd ofp-viewer
    npm install
    bower install

Angular Bootstrap needs to be built seperately

    cd app/components/angular-ui-bootstrap
    npm install
    grunt
    grunt build


Return to root directrory and run server with:

    cd ../../..
    grunt server

This code currently referencing a missing app/media folder that contains floorplans we use for demos.
We are working on replacing the demos with data that we can share as part of the project.
In the mean time, you will need to reconfigure it to use your own floorplans.

## Demo Data

The demo data included with this project is from http://www.physics.ohio-state.edu/fac_engr/flr_plans.html

(It isn't easy to find good public CAD data, they deserve credit for publishing their CAD files online.)

It is included for demonstration purposes only.

## License

OpenFloorPlan Viewer (ofp-viewer) is released under the MIT license, see LICENSE file.

