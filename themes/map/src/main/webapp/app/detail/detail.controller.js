/* global vkbeautify */
(function () {

  'use strict';

  angular.module('app.detail')
    .config(["MLRestProvider", function (MLRestProvider) {
        // Make MLRestProvider target url start with the page's base href (proxy)
        MLRestProvider.setPrefix(angular.element(document.querySelector('base')).attr('href')+'v1');
    }])
    .config(["visjsGraphServiceProvider", function ( visjsGraphServiceProvider) {
            // Make visjsGraphService target url start with the page's base href (proxy)
          visjsGraphServiceProvider.setApi(angular.element(document.querySelector('base')).attr('href')+'v1/resources');
    }])
    .controller('DetailCtrl', DetailCtrl);

  DetailCtrl.$inject = ['doc', '$stateParams', 'MLRest', 'RegisteredComponents', 'ngToast',
                        '$state', '$scope', '$sce', 'x2js', 'MLUiGmapManager'];

  // TODO: inject vkbeautify
  function DetailCtrl(doc, $stateParams, MLRest, RegisteredComponents, ngToast, $state, $scope, $sce, x2js, MLUiGmapManager) {
    var ctrl = this;

    var uri = $stateParams.uri;
    var contentType = doc.config.headers.Accept.split(/,/)[0];
    var paramsFormat = doc.config.params.format;
    var encodedUri = encodeURIComponent(uri);

		ctrl.defaultTab = 0;
		ctrl.html = $sce.trustAsHtml(doc.data.html);
		ctrl.graphSelected = false;

    /* jscs: disable */
    if (paramsFormat==='json' || contentType.lastIndexOf('application/json', 0) === 0) {
      /*jshint camelcase: false */
      ctrl.xml = vkbeautify.xml(x2js.json2xml_str(
          { xml: doc.data }
      ));
      ctrl.json = doc.data;
      ctrl.type = 'json';
    } else if (paramsFormat==='xml' || contentType.lastIndexOf('application/xml', 0) === 0) {
      ctrl.xml = vkbeautify.xml(doc.data);
      /*jshint camelcase: false */
        ctrl.json = x2js.xml_str2json(doc.data);
      ctrl.type = 'xml';
      /* jscs: enable */
    } else if (contentType.lastIndexOf('text/plain', 0) === 0) {
      ctrl.xml = doc.data;
      ctrl.json = {'Document' : doc.data};
      ctrl.type = 'text';
    } else if (contentType.lastIndexOf('application', 0) === 0 ) {
      ctrl.xml = 'Binary object';
      ctrl.json = {'Document type' : 'Binary object'};
      ctrl.type = 'binary';
      var parsedXML = jQuery.parseXML(doc.data);
      ctrl.binaryFilePath = parsedXML.getElementsByTagName('binary-file-location')[0].childNodes[0].nodeValue;
      ctrl.binaryContentType = parsedXML.getElementsByTagName('binary-content-type')[0].childNodes[0].nodeValue;
      ctrl.type = 'binary';
      if (/image\//.test(ctrl.binaryContentType)) {
          ctrl.binaryType = 'image';
      } else if (/application\/pdf/.test(ctrl.binaryContentType)) {
          ctrl.binaryType = 'pdf';
      } else {
          ctrl.binaryType = 'other';
      }
      var html = parsedXML.getElementsByTagName('html')[0];
      var metaElements = html.getElementsByTagName('meta');
      var halfWayPoint = Math.floor(metaElements.length / 2);
      if (metaElements.length > 0) {
          var i18n = {
              'content-type': 'Content Type',
              'size': 'Size',
              'NormalizedDate': 'Date Time'
          };
          var metaHighlights = ['content-type', 'NormalizedDate', 'size', 'Word_Count', 'Typist'];
          ctrl.meta = [{}, {}];
          var metaCount = 0,
              metaHighlightsCount = 0;

          ctrl.metaHighlights = [{}, {}];
          angular.forEach(metaElements, function(metaEl, index) {
              var metaObj;
              if (metaHighlights.indexOf(metaEl.getAttribute('name')) > -1) {
                  metaObj = ctrl.metaHighlights[metaHighlightsCount % 2];
                  metaHighlightsCount++;
              } else {
                  metaObj = ctrl.meta[metaCount % 2];
                  metaCount++;
                  ctrl.hasMeta = true;
              }
              var metaName = i18n[metaEl.getAttribute('name')] || metaEl.getAttribute('name') || metaEl.getAttribute('http-equiv')
                  .replace(/([a-z])([A-Z])/g, '$1 $2')
                  .replace(/(\-|\_)/g, ' ');
              metaObj[metaName] = metaEl.getAttribute('content') || ' ';
          });
      }

      var body = html.getElementsByTagName('body')[0];
      if (body) {
          ctrl.html = $sce.trustAsHtml(body.innerHTML);
      }
    } else {
      ctrl.xml = 'Error occured determining document type.';
      ctrl.json = {'Error' : 'Error occured determining document type.'};
    }

    function deleteDocument() {
      MLRest.deleteDocument(uri).then(function(response) {
        // TODO: not reached with code coverage yet!

        // create a toast with settings:
		  ngToast.create({
          className: 'warning',
          content: 'Deleted ' + uri,
          dismissOnTimeout: true,
          timeout: 2000,
          onDismiss: function () {
            //redirect to search page
            $state.go('root.search');
          }
        });
      }, function(response) {
				ngToast.danger(response.data);
      });
    }

    ctrl.showMarker = function(latitude, longitude, content, name) {
      var newMarkers = [];
      var m = {
        location: {
          latitude: latitude,
          longitude: longitude
        },
        title: name,
        id: 'detail-' + uri,
        content: content,
        icon: 'images/red-dot-marker.png'
      };
      newMarkers.push(m);
      mlMapManager.setMarkers('detail', newMarkers);
      mlMapManager.markerMode = 'detail';
      mlMapManager.center = { latitude: latitude, longitude: longitude };
    };

    if (ctrl.type === 'json' || ctrl.type === 'xml') {
      //note that this should be matched with the exact data
      if (ctrl.json.location && (ctrl.json.location.latitude !== undefined) &&
                                (ctrl.json.location.longitude !== undefined)) {
        ctrl.showMarker(ctrl.json.location.latitude, ctrl.json.location.longitude,
          ctrl.json, ctrl.json.name);
      }
    }

    angular.extend(ctrl, {
      doc : doc.data,
      uri : uri,
      contentType: contentType,
      fileName: uri.split('/').pop(),
      viewUri: 'v1/documents?uri=' + encodedUri + '&format=binary&transform=sanitize',
      downloadUri: 'v1/documents?uri=' + encodedUri + '&format=binary&transform=download',
      delete: deleteDocument
    });
  }
}());
