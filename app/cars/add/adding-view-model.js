const fromObject = require("data/observable").fromObject;
const Observable = require("data/observable").Observable;
const { knownFolders, path } = require("tns-core-modules/file-system");
const { fromAsset } = require("tns-core-modules/image-source");
const imagePicker = require("nativescript-imagepicker");

// helper pipe
const roundingValueConverter = require("../edit/roundingValueConverter");
const visibilityValueConverter = require("../edit/visibilityValueConverter");

const carService = require("../shared/car-service");

const tempImageFolderName = "nsimagepicker";
const carModel = {
    id: "",
    name: "",
    hasAC: Boolean(true),
    description: "",
    seats: "2",
    luggage: Number("2"),
    class: "Luxury",
    doors: Number("2"),
    price: Number("0"),
    transmission: "Manual",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/nativescriptjs.appspot.com/o/cars%2FMercedes%20S-Class%20Cabriolet.jpg?alt=media&token=c3df450c-c4ba-4409-ab62-88520529014a",
    imageStoragePath: "",
    isModelValid: false
};

function addViewModel() {
    const viewModel = fromObject({
        car: fromObject(carModel),
        isUpdating: false,
        _carService: carService.getInstance(),
        _isImageDirty: false,
        roundingValueConverter: roundingValueConverter,
        visibilityValueConverter: visibilityValueConverter,

        saveAdding: function () {
            let queue = Promise.resolve();
            let randID = Math.floor(Math.random()*10000).toString();

            this.set("isUpdating", true);

            if (this._isImageDirty && this.car.imageUrl) {
                queue = queue
                    .then(() => {
                        const localFullPath = this.car.imageUrl;
                        const remoteFullPath = `cars/${this.car.name}.jpg`;
                        this.car.set("imageStoragePath", remoteFullPath);
                        this.car.set("id", `car${randID}`);

                        return this._carService.uploadImage(remoteFullPath, localFullPath);
                    })
                    .then((uploadedFile) => {
                        return this._carService.getUploadUrl(`cars/${this.car.name}.jpg`, `gs://${uploadedFile.bucket}/`)
                    })
                    .then((url) => {
                        this.car.imageUrl = url;
                        this._isImageDirty = false;
                    })
            }

            return queue
                .then(() => this._carService.add(this.car))
                .then(() => this.set("isUpdating", false))
                .catch((errorMessage) => {
                    this.set("isUpdating", false);
                    throw errorMessage;
                });
        },

        onImageAddRemove: function () {
            if (this.car.imageUrl) {
                this._handleImageChange(null);
                return;
            }

            clearImageTempFolder();
            this._pickImage();
        },

        _pickImage: function () {
            const context = imagePicker.create({
                mode: "single"
            });

            context
                .authorize()
                .then(() => context.present())
                .then((selection) => selection.forEach(
                    (selectedAsset) => {
                        selectedAsset.options.height = 768;
                        fromAsset(selectedAsset)
                            .then((imageSource) => this._handleImageChange(imageSource));
                    })).catch((err) => console.log(err));
        },

        _handleImageChange: function (source) {
            let raisePropertyChange = true;
            let tempImagePath = null;
            if (source) {
                tempImagePath = path.join(getImageTempFolder().path, `${Date.now()}.jpg`);
                raisePropertyChange = source.saveToFile(tempImagePath, "jpeg");
            }

            if (raisePropertyChange) {
                this.car.set("imageUrl", tempImagePath);
                this._isImageDirty = true;
            }
        }
    });

    viewModel.car.addEventListener(Observable.propertyChangeEvent, (propertyChangeData) => {
        const propertyName = propertyChangeData.propertyName;
        if (propertyName === "name" || propertyName === "imageUrl") {
            viewModel.car.set("isModelValid", !!viewModel.car.name && !!viewModel.car.imageUrl);
        }
    })

    return viewModel;
}

function getImageTempFolder() {
    return knownFolders.temp().getFolder(tempImageFolderName);
}

function clearImageTempFolder() {
    getImageTempFolder().clear();
}

module.exports = addViewModel;
