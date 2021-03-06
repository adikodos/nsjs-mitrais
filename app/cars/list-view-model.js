const fromObject = require("data/observable").fromObject;
const ObservableArray = require("data/observable-array").ObservableArray;
const finalize = require("rxjs/operators").finalize;

const carService = require("./shared/car-service");
const userService = require("~/shared/services/user-service");

function listViewModel() {
    const viewModel = fromObject({
        cars: new ObservableArray([]),
        isLoading: false,

        _carService: carService.getInstance(),
        _userService: userService.getInstance(),
        _subscription: null,

        load: function () {
            if (!this._subscription) {
                this.set("isLoading", true);

                this._subscription = this._carService.load()
                    .pipe(finalize(() => this.set("isLoading", false)))
                    .subscribe((cars) => {
                        this.set("cars", new ObservableArray(cars));
                        this.set("isLoading", false);
                    });
            }
        },

        unload: function () {
            if (this._subscription) {
                this._subscription.unsubscribe();
                this._subscription = null;
            }
        },

        // for testing
        currentUser: function () {
            this._userService.getCurrentUser();
        },
        updateProfile: function () {
            this._userService.updateProfile();
        }
    });

    return viewModel;

}

module.exports = listViewModel;
