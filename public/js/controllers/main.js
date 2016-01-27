// js/controllers/main.js
angular.module('todoController', [])

// inject the Todo service factory into our controller
.controller('mainController', function($scope, $http, Todos) {
    $scope.formData = {};

    // GET =====================================================================
    // when landing on the page, get all todos and show them
    // use the service to get all the todos
    Todos.get()
        .success(function(data) {
            $scope.todos = data;
        });

    // CREATE ==================================================================
    // when submitting the add form, send the text to the node API
    $scope.createTodo = function() {

//         var formData = $scope.formData;
//         if (!$.isEmptyObject($scope.formData)) {
//             $upload.upload({
//                     url: '/api/todos', //upload.php script, node.js route, etc..
//                     method: 'POST', //Post or Put
//                     headers: {'Content-Type': 'multipart/form-data'},
//                     //withCredentials: true,
//                     data: formData, //from data to send along with the file
//                     file: blob, // or list of files ($files) for html5 only
//                     //fileName: 'photo' // to modify the name of the file(s)                
//                 }).success(function (response, status) {
//                     console.log(response);
//                     $scope.formData = {}; // clear the form so our user is ready to enter another
// //                  $scope.todos = data; // assign our new list of todos
//                 }
//                 ).error(function (err) {
//                        //error
//                     }
//                 );
//         }

        // var f = document.getElementById('todo-file').files[0],
        //     r = new FileReader();
        // r.onloadend = function(e){
        //     var filedata = e.target.result;
        //     console.log(e.target)
        //     //send you binary data via $http or $resource or do anything else with it

        //     // validate the formData to make sure that something is there
        //     // if form is empty, nothing will happen
        //     // people can't just hold enter to keep adding the same to-do anymore
            if (!$.isEmptyObject($scope.formData)) {

                // $scope.formData.file = filedata;

                // call the create function from our service (returns a promise object)
                Todos.create($scope.formData)

                        // if successful creation, call our get function to get all the new todos
                        .success(function(data) {

                            if (data.status == "error") {
                                window.location = '/';
                            }
                            else {   
                                $scope.formData = {}; // clear the form so our user is ready to enter another
                                $scope.todos = data; // assign our new list of todos
                            }
                        });
            }
        // }
        // r.readAsBinaryString(f);
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