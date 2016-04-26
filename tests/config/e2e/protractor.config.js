var jasmineReporters = require('jasmine-reporters');

exports.config = {
  baseUrl: 'http://localhost:3000',
  framework: 'jasmine2',
  specs: [
    'test-spec.js'
  ],
  multiCapabilities: [
    {
      browserName: 'chrome'
    },
    //{
     // browserName: 'firefox'
   // }
  ],

  onPrepare: function(){
    //Creates independent results files for each browser
    //Otherwise they run at the same time and overwrite each other
    var capsPromise = browser.getCapabilities();

    return capsPromise.then(function(caps){
        console.log(caps);
      var browserName = 'chrome';
      var browserVersion = '49.0.2623.87';
      var browserPrefix = browserName + '-' + browserVersion + '-';
      jasmine.getEnv().addReporter(new jasmineReporters.JUnitXmlReporter({
        savePath: 'tests/results/e2e/junit',
        filePrefix: browserPrefix,
        consolidateAll: false
      }));
    });
  }
};
