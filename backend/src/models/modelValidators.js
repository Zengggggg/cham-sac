export const HTTPS_URL_PATTERN = /^https:\/\/[^\s]+$/i;
export const GLB_URL_PATTERN = /^https:\/\/[^\s?#]+\.glb(?:[?#][^\s]*)?$/i;
export const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export const isNonNegativeSafeInteger = (value) => (
    Number.isSafeInteger(value) && value >= 0
);

export const nonNegativeMoneyField = {
    type: Number,
    required: true,
    min: 0,
    validate: {
        validator: isNonNegativeSafeInteger,
        message: '{PATH} phải là số nguyên VND không âm và nằm trong giới hạn an toàn.'
    }
};

export const toPlainObject = (_document, returnedObject) => {
    delete returnedObject._id;
    delete returnedObject.__v;
    return returnedObject;
};
