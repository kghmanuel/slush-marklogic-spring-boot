(function () {
  'use strict';

  angular.module('app.detail', [
    // inject dependencies
    'cb.x2js',
    'ml.common', // Using MLRest for delete
    'ngToast', // Showing toast on delete
    'ui.router',
    'app.map',

    // html dependencies
    'app.similar',
    'hljs',
    'ngJsonExplorer',
    'mwl.confirm', // for delete confirmation popups
    'ui.bootstrap',
    'view.file',
    'ml.visjsGraph'
  ]);
}());
