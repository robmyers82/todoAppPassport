// js/controllers/main.js
angular.module('todoController', [])

// inject the Todo service factory into our controller
.controller('mainController', function($scope, $http, $timeout, Todos, Upload) {
    $scope.formData = {};

    // GET =====================================================================
    // when landing on the page, get all todos and show them
    // use the service to get all the todos
    Todos.get()
        .success(function(data) {
            $scope.todos = data;
        });


    $scope.$watch('files', function (files) {
        $scope.formUpload = false;
        if (files != null) {
          if (!angular.isArray(files)) {
            $timeout(function () {
              $scope.files = files = [files];
            });
            return;
          }
          for (var i = 0; i < files.length; i++) {
            $scope.errorMsg = null;
            (function (f) {
              $scope.upload(f);
            })(files[i]);
          }
        }
    });

    $scope.createTodo = function (file) {
        $scope.formUpload = true;
        if (file != null) {
          $scope.upload(file)
        }
    };

    $scope.upload = function(file) {
        $scope.errorMsg = null;
        
        file.upload = Upload.upload({
          url: '/api/todos',
          data: {info: $scope.formData, file: file}
        });

        file.upload.then(function (response) {
          $timeout(function () {
            $scope.todos = response.data;
          });
        }, function (response) {
          if (response.status > 0)
            $scope.errorMsg = response.status + ': ' + response.data;
        }, function (evt) {
          // Math.min is to fix IE which reports 200% sometimes
          file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
        });

        file.upload.xhr(function (xhr) {
          // xhr.upload.addEventListener('abort', function(){console.log('abort complete')}, false);
        });
    };


    // DELETE ==================================================================
    // delete a todo after checking it
    $scope.deleteTodo = function(id) {
        Todos.delete(id)
            // if successful creation, call our get function to get all the new todos
            .success(function(data) {
                $scope.todos = data; // assign our new list of todos
            });
    };
});