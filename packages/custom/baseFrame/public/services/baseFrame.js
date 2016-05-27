'use strict';

/* This is the place to connect the server and the client.
* If correctly used, it connects the models and controllers on the server side
* to the controllers and views of the client side. It seems to be a better
* solution than $http.
*
* Check service/articles.js for example and
* https://docs.angularjs.org/api/ngResource/service/$resource
*
* Another important concept of Angular is a service and it will help to keep the
* controller as clean as possible
* See https://docs.angularjs.org/guide/services for instructions.
**/

angular.module('mean.baseFrame').factory('BaseFrame', [
    function() {
        return {
            name: 'baseFrame'
        };
    }
]);
