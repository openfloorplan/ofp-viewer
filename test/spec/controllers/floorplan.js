'use strict';

describe('Controller: FloorplanCtrl', function() {

  // load the controller's module
  beforeEach(module('floorplanApp'));

  var FloorplanCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller) {
    scope = {};
    FloorplanCtrl = $controller('FloorplanCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function() {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
