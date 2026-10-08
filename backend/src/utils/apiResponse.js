const normalizeErrors = (errors) => {
    if (errors === undefined || errors === null) return null;
    if (Array.isArray(errors)) return errors;
    if (typeof errors === 'string') return [{ message: errors }];
    return [errors];
};

export const createSuccessResponse = ({
    statusCode = 200,
    message,
    data = null,
    meta = null
}) => ({
    success: true,
    statusCode,
    message,
    data,
    meta,
    errors: null
});

export const createErrorResponse = ({
    statusCode,
    message,
    errors = null,
    meta = null
}) => ({
    success: false,
    statusCode,
    message,
    data: null,
    meta,
    errors: normalizeErrors(errors)
});

export const sendSuccess = (res, options) => {
    const response = createSuccessResponse(options);
    return res.status(response.statusCode).json(response);
};

export const sendError = (res, options) => {
    const response = createErrorResponse(options);
    return res.status(response.statusCode).json(response);
};
