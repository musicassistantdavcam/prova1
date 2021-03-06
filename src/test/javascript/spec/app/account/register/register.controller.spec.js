'use strict';

describe('Controller Tests', function() {

    beforeEach(mockApiAccountCall);
    beforeEach(mockI18nCalls);

    describe('RegisterController', function() {

        var $scope, $q, errorConstants; // actual implementations
        var MockTimeout, MockTranslate, MockAuth; // mocks
        var createController; // local utility function

        beforeEach(inject(function($injector) {
            $q = $injector.get('$q');
            $scope = $injector.get('$rootScope').$new();
            errorConstants = $injector.get('errorConstants');
            MockTimeout = jasmine.createSpy('MockTimeout');
            MockAuth = jasmine.createSpyObj('MockAuth', ['createAccount']);
            MockTranslate = jasmine.createSpyObj('MockTranslate', ['use']);

            var locals = {
                'errorConstants': errorConstants,
                'Auth': MockAuth,
                '$translate': MockTranslate,
                '$timeout': MockTimeout,
                '$scope': $scope
            };
            createController = function() {
                $injector.get('$controller')('RegisterController as vm', locals);
            };
        }));

        it('should ensure the two passwords entered match', function() {
            // given
            createController();
            $scope.vm.registerAccount.password = 'password';
            $scope.vm.confirmPassword = 'non-matching';
            // when
            $scope.vm.register();
            // then
            expect($scope.vm.doNotMatch).toEqual('ERROR');
        });

        it('should update success to OK after creating an account', function() {
            // given
            MockTranslate.use.and.returnValue('it');
            MockAuth.createAccount.and.returnValue($q.resolve());
            createController();
            $scope.vm.registerAccount.password = $scope.vm.confirmPassword = 'password';
            // when
            $scope.$apply($scope.vm.register); // $q promises require an $apply
            // then
            expect(MockAuth.createAccount).toHaveBeenCalledWith({
                password: 'password',
                langKey: 'it'
            });
            expect($scope.vm.success).toEqual('OK');
            expect($scope.vm.registerAccount.langKey).toEqual('it');
            expect(MockTranslate.use).toHaveBeenCalled();
            expect($scope.vm.errorUserExists).toBeNull();
            expect($scope.vm.errorEmailExists).toBeNull();
            expect($scope.vm.error).toBeNull();
        });

        it('should notify of user existence upon 400/login already in use', function() {
            // given
            MockAuth.createAccount.and.returnValue($q.reject({
                status: 400,
                data: '{"type": "' + errorConstants.LOGIN_ALREADY_USED_TYPE + '"}'
            }));
            createController();
            $scope.vm.registerAccount.password = $scope.vm.confirmPassword = 'password';
            // when
            $scope.$apply($scope.vm.register); // $q promises require an $apply
            // then
            expect($scope.vm.errorUserExists).toEqual('ERROR');
            expect($scope.vm.errorEmailExists).toBeNull();
            expect($scope.vm.error).toBeNull();
        });

        it('should notify of email existence upon 400/email address already in use', function() {
            // given
            MockAuth.createAccount.and.returnValue($q.reject({
                status: 400,
                data: '{"type": "' + errorConstants.EMAIL_ALREADY_USED_TYPE + '"}'
            }));
            createController();
            $scope.vm.registerAccount.password = $scope.vm.confirmPassword = 'password';
            // when
            $scope.$apply($scope.vm.register); // $q promises require an $apply
            // then
            expect($scope.vm.errorEmailExists).toEqual('ERROR');
            expect($scope.vm.errorUserExists).toBeNull();
            expect($scope.vm.error).toBeNull();
        });

        it('should notify of generic error', function() {
            // given
            MockAuth.createAccount.and.returnValue($q.reject({
                status: 503
            }));
            createController();
            $scope.vm.registerAccount.password = $scope.vm.confirmPassword = 'password';
            // when
            $scope.$apply($scope.vm.register); // $q promises require an $apply
            // then
            expect($scope.vm.errorUserExists).toBeNull();
            expect($scope.vm.errorEmailExists).toBeNull();
            expect($scope.vm.error).toEqual('ERROR');
        });

    });
});
