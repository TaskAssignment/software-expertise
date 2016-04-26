'use strict';

angular.module('mean.upload').controller('MeanUploadController', ['$scope', 'Global', 'MeanUpload', '$http',
  function($scope, Global, MeanUpload, $http) {

    $scope.global = Global;
    $scope.images = [];
    $scope.files = [];
    $scope.package = {
      name: 'mean-upload'
    };

    $scope.images = [];

    $scope.uploadFileCallback = function(file) {
      if (file.type.indexOf('image') !== -1){
        $scope.images.push(file);
        $scope.addSlide(file.src);
      }
      else{
        $scope.files.push(file);
      }
    };

    $scope.uploadFinished = function(files) {
      console.log(files);
    };


    /**
     * Makes an http post request to get json back with the CoOccurences.
     * Converts to a .tsv and starts the download
     * Please note: the file is filtered in the API so that low count CoOccurences don't waste space
     *
     * @param apiCallUrl
     * @return the CoOccurence File
     * @see coOccurrences.tsv
     */

    $scope.downloadCO = function() {

     var dataString='getEverything=true';
     var urlStr = window.location.href.toString();
     urlStr = urlStr.slice(0,-3);
     var apiCallUrl  = urlStr+'api/baseFrame/coOccurence'

     console.log(apiCallUrl);
     var rows = '';

     console.log("Downloading/generating these files may take a while due to their size, please be patient");

     $http({
      method: 'POST',
      url: apiCallUrl,
      data: dataString,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function (response) {

      for (var key in response[0]) {
        if (response[0].hasOwnProperty(key)) {
          rows += (key + '\t');
        }
      }
      rows += '\n';

      for(var i = 0; i < response.length; i++) {

        for (var column in response[i]) {
          if (response[0].hasOwnProperty(column)) {
            rows += (response[i][column] + '\t');
          }
        }
        rows += '\n';
      }

      var blobCO = new Blob([rows], {type: 'text/plain;charset=utf-8'});
      saveAs(blobCO, "coOccurrences.tsv");
    });
  };


  /**
   * Makes an http post request to get json back with the tags.
   * Converts to a .tsv and starts the download
   *
   * @param apiCallUrlISo
   * @return .tsv file of tags
   * @see tags.tsv
   */

  $scope.downloadTags = function() {

    var urlStr = window.location.href.toString();
    urlStr = urlStr.slice(0,-3);
    var apiCallUrlSO  = urlStr+'api/baseFrame/soTags';

    console.log(apiCallUrlSO);
    var rows = '';

    console.log("Downloading/generating these files may take a while due to their size, please be patient");

    $http({
      method: 'POST',
      url: apiCallUrlSO,
      data: '',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function (response) {

      for (var key in response[0]) {
        if (response[0].hasOwnProperty(key)) {
          rows += (key + '\t');
        }
      }
      rows += '\n';

      for(var i = 0; i < response.length; i++) {

        for (var column in response[i]) {
          if (response[0].hasOwnProperty(column)) {
            rows += (response[i][column] + '\t');
          }
        }
        rows += '\n';
      }

      var blobCO = new Blob([rows], {type: 'text/plain;charset=utf-8'});
      saveAs(blobCO, "tags.tsv");
    });
  };

  /**
   * Makes an http post request to get json back with the common user info.
   * Converts to a .tsv and starts the download
   *
   * @param apiCallUrlISo
   * @return .tsv file of commonUsers
   * @see commonUsers.tsv
   */

  $scope.downloadUsers = function() {

    var dataString='getAll=true';
    var urlStr = window.location.href.toString();
    urlStr = urlStr.slice(0,-3);
    var apiCallUrlSO  = urlStr+'api/baseFrame/soIDFromUser';

    console.log(apiCallUrlSO);
    var rows = '';

    console.log("Downloading/generating these files may take a while due to their size, please be patient");

    $http({
      method: 'POST',
      url: apiCallUrlSO,
      data: dataString,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function (response) {

      for (var key in response[0]) {
        if (response[0].hasOwnProperty(key)) {
          rows += (key + '\t');
        }
      }
      rows += '\n';

      for(var i = 0; i < response.length; i++) {

        for (var column in response[i]) {
          if (response[0].hasOwnProperty(column)) {
            rows += (response[i][column] + '\t');
          }
        }
        rows += '\n';
      }

      var blobCO = new Blob([rows], {type: 'text/plain;charset=utf-8'});
      saveAs(blobCO, "commonUsers.tsv");
    });
  };


  $scope.myInterval = 5000;
  var slides = $scope.slides = [];
  $scope.addSlide = function(url) {

    slides.push({
     image: url
   });
  };
}
]);
