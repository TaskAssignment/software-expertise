var expertise = angular.module('mean.expertise')
expertise.factory('screen', function () {
    loading = function () {
        angular.element('#loadingImage').css('display', 'block');
    }

    ready = function () {
        angular.element('#loadingImage').css('display', 'none');
    }

    return {
        loading: loading,
        ready: ready,
    }
});
