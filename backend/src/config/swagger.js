import swaggerJSDoc from 'swagger-jsdoc';
import { API_PREFIX, API_STATUS_MESSAGE } from './api.js';

const errorResponse = (description) => ({
    description,
    content: {
        'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
        }
    }
});

const authResponse = {
    description: 'Thao tác xác thực thành công.',
    content: {
        'application/json': {
            schema: { $ref: '#/components/schemas/AuthResponse' }
        }
    }
};

const jsonRequest = (schema) => ({
    required: true,
    content: {
        'application/json': { schema }
    }
});

const responseRequiredFields = [
    'success',
    'statusCode',
    'message',
    'data',
    'meta',
    'errors'
];

const nullableMetaSchema = {
    type: 'object',
    nullable: true,
    additionalProperties: true,
    example: null
};

const nullableErrorsSchema = {
    type: 'array',
    nullable: true,
    example: null,
    items: { $ref: '#/components/schemas/ErrorDetail' }
};

const successProperties = (message, statusCode = 200) => ({
    success: { type: 'boolean', enum: [true], example: true },
    statusCode: { type: 'integer', example: statusCode },
    message: { type: 'string', example: message },
    meta: nullableMetaSchema,
    errors: nullableErrorsSchema
});

const swaggerDefinition = {
    openapi: '3.0.3',
    info: {
        title: 'Chạm Sắc Việt API',
        version: '1.0.0',
        description: `Tài liệu tương tác cho backend Chạm Sắc Việt. Các endpoint dùng prefix \`${API_PREFIX}\`.`
    },
    servers: [
        {
            url: '/',
            description: 'Server hiện tại'
        }
    ],
    tags: [
        { name: 'System', description: 'Trạng thái hệ thống' },
        { name: 'Auth', description: 'Đăng ký, đăng nhập và quản lý phiên' },
        { name: 'Admin', description: 'Dashboard, tài khoản, nội dung và AR' },
        { name: 'Admin Shop', description: 'Sản phẩm, tồn kho và đơn hàng' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Nhập access token nhận được sau khi đăng nhập.'
            }
        },
        schemas: {
            User: {
                type: 'object',
                required: [
                    'id',
                    'name',
                    'email',
                    'role',
                    'status',
                    'isVerified',
                    'emailVerifiedAt'
                ],
                properties: {
                    id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                    name: { type: 'string', example: 'Nguyễn An' },
                    fullName: { type: 'string', example: 'Nguyễn An' },
                    email: { type: 'string', format: 'email', example: 'an@example.com' },
                    phone: { type: 'string', nullable: true, example: '+84901234567' },
                    avatarUrl: {
                        type: 'string',
                        format: 'uri',
                        nullable: true,
                        example: 'https://example.com/avatar.jpg'
                    },
                    role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
                    status: {
                        type: 'string',
                        enum: ['pending_verification', 'active', 'blocked'],
                        example: 'active'
                    },
                    isVerified: {
                        type: 'boolean',
                        readOnly: true,
                        example: true,
                        description: 'Derived from emailVerifiedAt; this field is not persisted.'
                    },
                    emailVerifiedAt: {
                        type: 'string',
                        format: 'date-time',
                        nullable: true
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            AuthData: {
                type: 'object',
                required: ['user', 'accessToken', 'refreshToken'],
                properties: {
                    user: { $ref: '#/components/schemas/User' },
                    accessToken: { type: 'string', description: 'JWT dùng cho Bearer authentication.' },
                    refreshToken: { type: 'string', description: 'JWT dùng để làm mới phiên đăng nhập.' }
                }
            },
            AuthResponse: {
                type: 'object',
                required: responseRequiredFields,
                properties: {
                    ...successProperties('Đăng nhập thành công.'),
                    data: { $ref: '#/components/schemas/AuthData' }
                }
            },
            VerificationRequiredResponse: {
                type: 'object',
                required: responseRequiredFields,
                properties: {
                    ...successProperties('Đã gửi OTP xác minh đến email của bạn.', 201),
                    data: {
                        type: 'object',
                        required: ['email', 'verificationRequired'],
                        properties: {
                            email: { type: 'string', format: 'email', example: 'an@example.com' },
                            verificationRequired: { type: 'boolean', example: true },
                            expiresInSeconds: { type: 'integer', example: 600 },
                            resendAvailableInSeconds: { type: 'integer', example: 60 }
                        }
                    }
                }
            },
            PasswordResetOtpResponse: {
                type: 'object',
                required: responseRequiredFields,
                properties: {
                    ...successProperties('Đã gửi OTP đặt lại mật khẩu đến email của bạn.'),
                    data: {
                        type: 'object',
                        required: ['email', 'passwordResetRequired'],
                        properties: {
                            email: { type: 'string', format: 'email', example: 'an@example.com' },
                            passwordResetRequired: { type: 'boolean', example: true },
                            expiresInSeconds: { type: 'integer', example: 600 },
                            resendAvailableInSeconds: { type: 'integer', example: 60 }
                        }
                    }
                }
            },
            UserResponse: {
                type: 'object',
                required: responseRequiredFields,
                properties: {
                    ...successProperties('Lấy thông tin người dùng thành công.'),
                    data: {
                        type: 'object',
                        required: ['user'],
                        properties: {
                            user: { $ref: '#/components/schemas/User' }
                        }
                    }
                }
            },
            StatusResponse: {
                type: 'object',
                required: responseRequiredFields,
                properties: {
                    ...successProperties(API_STATUS_MESSAGE),
                    data: {
                        type: 'object',
                        required: ['status'],
                        properties: {
                            status: { type: 'string', enum: ['healthy'], example: 'healthy' }
                        }
                    }
                }
            },
            EmptySuccessResponse: {
                type: 'object',
                required: responseRequiredFields,
                properties: {
                    ...successProperties('Thao tác thành công.'),
                    data: { type: 'object', nullable: true, example: null }
                }
            },
            ErrorDetail: {
                type: 'object',
                required: ['message'],
                properties: {
                    field: { type: 'string', example: 'email' },
                    message: { type: 'string', example: 'Email không hợp lệ.' }
                }
            },
            ErrorResponse: {
                type: 'object',
                required: responseRequiredFields,
                properties: {
                    success: { type: 'boolean', enum: [false], example: false },
                    statusCode: { type: 'integer', example: 422 },
                    message: { type: 'string', example: 'Dữ liệu không hợp lệ.' },
                    data: { type: 'object', nullable: true, example: null },
                    meta: nullableMetaSchema,
                    errors: {
                        type: 'array',
                        nullable: true,
                        items: {
                            $ref: '#/components/schemas/ErrorDetail'
                        }
                    }
                }
            }
        }
    },
    paths: {
        [`${API_PREFIX}/status`]: {
            get: {
                tags: ['System'],
                summary: 'Kiểm tra trạng thái API',
                operationId: 'getApiStatus',
                responses: {
                    200: {
                        description: 'API đang hoạt động.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/StatusResponse'
                                }
                            }
                        }
                    }
                }
            }
        },
        [`${API_PREFIX}/auth/register`]: {
            post: {
                tags: ['Auth'],
                summary: 'Đăng ký bằng email và mật khẩu',
                operationId: 'register',
                requestBody: jsonRequest({
                    type: 'object',
                    required: ['name', 'email', 'password'],
                    properties: {
                        name: { type: 'string', minLength: 2, maxLength: 100, example: 'Nguyễn An' },
                        email: { type: 'string', format: 'email', maxLength: 254, example: 'an@example.com' },
                        password: { type: 'string', format: 'password', minLength: 8, maxLength: 72, example: 'matkhau123' }
                    }
                }),
                responses: {
                    201: {
                        description: 'Đã tạo tài khoản chờ xác minh và gửi OTP qua email.',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/VerificationRequiredResponse' }
                            }
                        }
                    },
                    502: errorResponse('Không thể gửi email xác minh qua Resend.'),
                    409: errorResponse('Email đã được sử dụng.'),
                    422: errorResponse('Dữ liệu đăng ký không hợp lệ.'),
                    429: errorResponse('Đã vượt quá giới hạn request xác thực.')
                }
            }
        },
        [`${API_PREFIX}/auth/verify-email`]: {
            post: {
                tags: ['Auth'],
                summary: 'Xác minh OTP và kích hoạt tài khoản',
                operationId: 'verifyEmail',
                requestBody: jsonRequest({
                    type: 'object',
                    required: ['email', 'otp'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'an@example.com' },
                        otp: {
                            type: 'string',
                            pattern: '^\\d{6}$',
                            example: '123456'
                        }
                    }
                }),
                responses: {
                    200: { ...authResponse, description: 'Kích hoạt tài khoản thành công.' },
                    400: errorResponse('OTP không đúng hoặc không còn tồn tại.'),
                    410: errorResponse('OTP đã hết hạn.'),
                    422: errorResponse('Email hoặc định dạng OTP không hợp lệ.'),
                    429: errorResponse('Đã vượt quá giới hạn thử OTP.')
                }
            }
        },
        [`${API_PREFIX}/auth/resend-verification-otp`]: {
            post: {
                tags: ['Auth'],
                summary: 'Gửi lại OTP xác minh email',
                operationId: 'resendEmailVerificationOtp',
                requestBody: jsonRequest({
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'an@example.com' }
                    }
                }),
                responses: {
                    200: {
                        description: 'Yêu cầu gửi lại OTP đã được tiếp nhận.',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/VerificationRequiredResponse' }
                            }
                        }
                    },
                    422: errorResponse('Email không hợp lệ.'),
                    429: errorResponse('Yêu cầu gửi lại quá sớm hoặc vượt giới hạn.'),
                    502: errorResponse('Không thể gửi email xác minh qua Resend.')
                }
            }
        },
        [`${API_PREFIX}/auth/forgot-password`]: {
            post: {
                tags: ['Auth'],
                summary: 'Gửi OTP đặt lại mật khẩu đến email đã đăng ký',
                operationId: 'forgotPassword',
                requestBody: jsonRequest({
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'an@example.com' }
                    }
                }),
                responses: {
                    200: {
                        description: 'Đã gửi OTP đặt lại mật khẩu.',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/PasswordResetOtpResponse' }
                            }
                        }
                    },
                    404: errorResponse('Email chưa được đăng ký trong hệ thống.'),
                    409: errorResponse('Tài khoản chưa hoàn tất xác minh email.'),
                    422: errorResponse('Email không hợp lệ.'),
                    429: errorResponse('Yêu cầu OTP quá sớm hoặc vượt giới hạn.'),
                    502: errorResponse('Không thể gửi email OTP qua Resend.')
                }
            }
        },
        [`${API_PREFIX}/auth/reset-password`]: {
            post: {
                tags: ['Auth'],
                summary: 'Đặt lại mật khẩu bằng OTP',
                operationId: 'resetPassword',
                requestBody: jsonRequest({
                    type: 'object',
                    required: ['email', 'otp', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'an@example.com' },
                        otp: { type: 'string', pattern: '^\\d{6}$', example: '123456' },
                        password: {
                            type: 'string',
                            format: 'password',
                            minLength: 8,
                            maxLength: 72,
                            example: 'matkhaumoi123'
                        }
                    }
                }),
                responses: {
                    200: {
                        description: 'Đặt lại mật khẩu và thu hồi phiên đăng nhập cũ thành công.',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/EmptySuccessResponse' }
                            }
                        }
                    },
                    400: errorResponse('OTP không đúng hoặc không còn tồn tại.'),
                    410: errorResponse('OTP đã hết hạn.'),
                    422: errorResponse('Email, OTP hoặc mật khẩu mới không hợp lệ.'),
                    429: errorResponse('Đã vượt quá giới hạn thử OTP.')
                }
            }
        },
        [`${API_PREFIX}/auth/login`]: {
            post: {
                tags: ['Auth'],
                summary: 'Đăng nhập bằng email và mật khẩu',
                operationId: 'login',
                requestBody: jsonRequest({
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'an@example.com' },
                        password: { type: 'string', format: 'password', example: 'matkhau123' }
                    }
                }),
                responses: {
                    200: authResponse,
                    401: errorResponse('Email hoặc mật khẩu không đúng.'),
                    403: errorResponse('Tài khoản chưa xác minh email hoặc đã bị khóa.'),
                    422: errorResponse('Dữ liệu đăng nhập không hợp lệ.'),
                    429: errorResponse('Đã vượt quá giới hạn request xác thực.')
                }
            }
        },
        [`${API_PREFIX}/auth/google`]: {
            post: {
                tags: ['Auth'],
                summary: 'Đăng nhập hoặc đăng ký bằng Google',
                operationId: 'googleLogin',
                requestBody: jsonRequest({
                    type: 'object',
                    required: ['idToken'],
                    properties: {
                        idToken: { type: 'string', description: 'Google ID token từ Google Identity Services.' }
                    }
                }),
                responses: {
                    200: authResponse,
                    401: errorResponse('Google ID token không hợp lệ.'),
                    403: errorResponse('Tài khoản đã bị khóa.'),
                    409: errorResponse('Email không thể tự động liên kết với Google.'),
                    422: errorResponse('Thiếu Google ID token.'),
                    429: errorResponse('Đã vượt quá giới hạn request xác thực.')
                }
            }
        },
        [`${API_PREFIX}/auth/google/link`]: {
            post: {
                tags: ['Auth'],
                summary: 'Liên kết Google với tài khoản hiện tại',
                operationId: 'linkGoogleAccount',
                security: [{ bearerAuth: [] }],
                requestBody: jsonRequest({
                    type: 'object',
                    required: ['idToken'],
                    properties: {
                        idToken: { type: 'string', description: 'Google ID token từ Google Identity Services.' }
                    }
                }),
                responses: {
                    200: {
                        description: 'Liên kết Google thành công.',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UserResponse' }
                            }
                        }
                    },
                    401: errorResponse('Access token hoặc Google ID token không hợp lệ.'),
                    404: errorResponse('Tài khoản không tồn tại.'),
                    409: errorResponse('Google Account đã được liên kết.'),
                    422: errorResponse('Thiếu Google ID token.'),
                    429: errorResponse('Đã vượt quá giới hạn request xác thực.')
                }
            }
        },
        [`${API_PREFIX}/auth/refresh-token`]: {
            post: {
                tags: ['Auth'],
                summary: 'Làm mới access token và xoay refresh token',
                operationId: 'refreshToken',
                requestBody: jsonRequest({
                    type: 'object',
                    required: ['refreshToken'],
                    properties: {
                        refreshToken: { type: 'string', description: 'Refresh token còn hiệu lực.' }
                    }
                }),
                responses: {
                    200: authResponse,
                    401: errorResponse('Refresh token không hợp lệ hoặc đã hết hạn.'),
                    422: errorResponse('Thiếu refresh token.'),
                    429: errorResponse('Đã vượt quá giới hạn request xác thực.')
                }
            }
        },
        [`${API_PREFIX}/auth/logout`]: {
            post: {
                tags: ['Auth'],
                summary: 'Đăng xuất và thu hồi refresh token',
                operationId: 'logout',
                requestBody: jsonRequest({
                    type: 'object',
                    required: ['refreshToken'],
                    properties: {
                        refreshToken: { type: 'string', description: 'Refresh token cần thu hồi.' }
                    }
                }),
                responses: {
                    200: {
                        description: 'Đăng xuất thành công.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/EmptySuccessResponse'
                                }
                            }
                        }
                    },
                    401: errorResponse('Refresh token không hợp lệ hoặc đã hết hạn.'),
                    422: errorResponse('Thiếu refresh token.')
                }
            }
        },
        [`${API_PREFIX}/auth/me`]: {
            get: {
                tags: ['Auth'],
                summary: 'Lấy thông tin người dùng hiện tại',
                operationId: 'getCurrentUser',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Thông tin người dùng hiện tại.',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UserResponse' }
                            }
                        }
                    },
                    401: errorResponse('Chưa đăng nhập hoặc access token không hợp lệ.'),
                    403: errorResponse('Tài khoản đã bị khóa.')
                }
            }
        }
    }
};

swaggerDefinition.tags.push(
    { name: 'AR', description: 'Trải nghiệm WebAR công khai' },
    { name: 'Shop', description: 'Danh mục sản phẩm cho user' },
    { name: 'Cart', description: 'Giỏ hàng của user' },
    { name: 'Orders', description: 'Checkout và đơn hàng của user' },
    { name: 'Payments', description: 'Thanh toán payOS' },
    { name: 'Questions', description: 'Câu hỏi public và danh sách private của user' },
    { name: 'Admin Shop', description: 'Quản trị sản phẩm và đơn hàng' }
);

Object.assign(swaggerDefinition.components.schemas, {
    ArExperience: {
        type: 'object',
        required: [
            'id',
            'modelId',
            'targetIndex',
            'name',
            'shortDescription',
            'content',
            'targetImageUrl',
            'model'
        ],
        properties: {
            id: { type: 'string' },
            modelId: { type: 'string' },
            targetIndex: { type: 'integer', minimum: 0, maximum: 8, example: 5 },
            name: { type: 'string', example: 'Hồ Gươm' },
            shortDescription: { type: 'string' },
            content: { type: 'string' },
            targetImageUrl: { type: 'string', format: 'uri' },
            model: {
                type: 'object',
                required: ['url', 'scale', 'position', 'rotation', 'thumbnail'],
                properties: {
                    url: { type: 'string', format: 'uri' },
                    scale: { type: 'number', exclusiveMinimum: 0 },
                    position: {
                        type: 'object',
                        required: ['x', 'y', 'z'],
                        properties: {
                            x: { type: 'number' },
                            y: { type: 'number' },
                            z: { type: 'number' }
                        }
                    },
                    rotation: {
                        type: 'object',
                        required: ['x', 'y', 'z'],
                        properties: {
                            x: { type: 'number' },
                            y: { type: 'number' },
                            z: { type: 'number' }
                        }
                    },
                    thumbnail: { type: 'string', format: 'uri', nullable: true }
                }
            }
        }
    },
    ArExperiencesResponse: {
        type: 'object',
        required: responseRequiredFields,
        properties: {
            ...successProperties('Lấy danh sách trải nghiệm AR thành công.'),
            data: {
                type: 'object',
                required: ['experiences'],
                properties: {
                    experiences: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ArExperience' }
                    }
                }
            }
        }
    },
    Product: {
        type: 'object',
        required: ['id', 'name', 'price', 'stock', 'status'],
        properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'integer', minimum: 0 },
            stock: { type: 'integer', minimum: 0 },
            images: { type: 'array', items: { type: 'string', format: 'uri' } },
            status: { type: 'string', enum: ['active', 'inactive', 'sold_out'] },
            availabilityStatus: { type: 'string', enum: ['active', 'inactive', 'sold_out'] },
            canPurchase: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
        }
    },
    Order: {
        type: 'object',
        required: ['id', 'orderCode', 'items', 'totalAmount', 'paymentStatus', 'orderStatus'],
        properties: {
            id: { type: 'string' },
            orderCode: { type: 'string' },
            items: { type: 'array', items: { type: 'object', additionalProperties: true } },
            shippingFee: { type: 'integer', minimum: 0 },
            totalAmount: { type: 'integer', minimum: 0 },
            paymentStatus: { type: 'string', enum: ['unpaid', 'paid', 'refunded'] },
            orderStatus: {
                type: 'string',
                enum: ['pending', 'confirmed', 'shipping', 'done', 'cancelled']
            },
            expiresAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
        }
    },
    ShopObjectResponse: {
        type: 'object',
        required: responseRequiredFields,
        properties: {
            ...successProperties('Thao tác shop thành công.'),
            data: { type: 'object', additionalProperties: true }
        }
    },
    ShopListResponse: {
        type: 'object',
        required: responseRequiredFields,
        properties: {
            ...successProperties('Lấy danh sách thành công.'),
            data: { type: 'array', items: { type: 'object', additionalProperties: true } }
        }
    }
});

const bearerSecurity = [{ bearerAuth: [] }];
const shopObjectResponse = {
    description: 'Thao tác thành công.',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ShopObjectResponse' } } }
};
const shopListResponse = {
    description: 'Lấy danh sách thành công.',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ShopListResponse' } } }
};
const objectIdParameter = (name) => ({
    in: 'path',
    name,
    required: true,
    schema: { type: 'string' }
});

Object.assign(swaggerDefinition.paths, {
    [`${API_PREFIX}/ar/experiences`]: {
        get: {
            tags: ['AR'],
            summary: 'Danh sách trải nghiệm AR đã xuất bản',
            operationId: 'listArExperiences',
            responses: {
                200: {
                    description: 'Cấu hình target, nội dung địa danh và model 3D công khai.',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ArExperiencesResponse' }
                        }
                    }
                }
            }
        }
    },
    [`${API_PREFIX}/questions/public`]: {
        get: {
            tags: ['Questions'], summary: 'Câu hỏi public theo địa danh',
            responses: { 200: shopListResponse }
        }
    },
    [`${API_PREFIX}/questions/public/{heritageSiteId}`]: {
        get: {
            tags: ['Questions'], summary: 'Câu hỏi public của một địa danh',
            parameters: [objectIdParameter('heritageSiteId')],
            responses: { 200: shopObjectResponse, 404: errorResponse('Địa danh không tồn tại.') }
        }
    },
    [`${API_PREFIX}/questions/lists`]: {
        get: {
            tags: ['Questions'], summary: 'Danh sách câu hỏi private của user',
            security: bearerSecurity,
            responses: { 200: shopListResponse }
        },
        post: {
            tags: ['Questions'], summary: 'Tạo danh sách câu hỏi private',
            security: bearerSecurity,
            requestBody: jsonRequest({
                type: 'object',
                required: ['name', 'heritageSiteId'],
                properties: {
                    name: { type: 'string', minLength: 2, maxLength: 100 },
                    heritageSiteId: { type: 'string' }
                }
            }),
            responses: { 201: shopObjectResponse, 409: errorResponse('Đã đạt giới hạn danh sách.') }
        }
    },
    [`${API_PREFIX}/questions/lists/{listId}`]: {
        patch: {
            tags: ['Questions'], summary: 'Cập nhật danh sách câu hỏi private',
            security: bearerSecurity,
            parameters: [objectIdParameter('listId')],
            requestBody: jsonRequest({ type: 'object' }),
            responses: { 200: shopObjectResponse }
        },
        delete: {
            tags: ['Questions'], summary: 'Xóa danh sách câu hỏi private',
            security: bearerSecurity,
            parameters: [objectIdParameter('listId')],
            responses: { 200: shopObjectResponse }
        }
    },
    [`${API_PREFIX}/questions/lists/{listId}/items`]: {
        post: {
            tags: ['Questions'], summary: 'Thêm câu hỏi vào danh sách private',
            security: bearerSecurity,
            parameters: [objectIdParameter('listId')],
            requestBody: jsonRequest({
                type: 'object', required: ['content'],
                properties: { content: { type: 'string', minLength: 3, maxLength: 500 } }
            }),
            responses: { 201: shopObjectResponse }
        }
    },
    [`${API_PREFIX}/questions/lists/{listId}/items/{questionId}`]: {
        patch: {
            tags: ['Questions'], summary: 'Cập nhật câu hỏi private',
            security: bearerSecurity,
            parameters: [objectIdParameter('listId'), objectIdParameter('questionId')],
            requestBody: jsonRequest({
                type: 'object', required: ['content'],
                properties: { content: { type: 'string', minLength: 3, maxLength: 500 } }
            }),
            responses: { 200: shopObjectResponse }
        },
        delete: {
            tags: ['Questions'], summary: 'Xóa câu hỏi private',
            security: bearerSecurity,
            parameters: [objectIdParameter('listId'), objectIdParameter('questionId')],
            responses: { 200: shopObjectResponse }
        }
    },
    [`${API_PREFIX}/shop/boxes`]: {
        get: {
            tags: ['Shop'], summary: 'Danh sách sản phẩm đang bán',
            responses: { 200: shopListResponse }
        }
    },
    [`${API_PREFIX}/shop/boxes/{id}`]: {
        get: {
            tags: ['Shop'], summary: 'Chi tiết sản phẩm',
            parameters: [objectIdParameter('id')],
            responses: { 200: shopObjectResponse, 404: errorResponse('Sản phẩm không tồn tại.') }
        }
    },
    [`${API_PREFIX}/cart`]: {
        get: {
            tags: ['Cart'], summary: 'Lấy giỏ hàng', security: bearerSecurity,
            responses: { 200: shopObjectResponse }
        }
    },
    [`${API_PREFIX}/cart/items`]: {
        post: {
            tags: ['Cart'], summary: 'Thêm sản phẩm vào giỏ', security: bearerSecurity,
            requestBody: jsonRequest({
                type: 'object', required: ['productId', 'quantity'],
                properties: { productId: { type: 'string' }, quantity: { type: 'integer', minimum: 1 } }
            }),
            responses: { 200: shopObjectResponse, 409: errorResponse('Số lượng vượt tồn kho.') }
        }
    },
    [`${API_PREFIX}/cart/items/{productId}`]: {
        patch: {
            tags: ['Cart'], summary: 'Cập nhật dòng giỏ', security: bearerSecurity,
            parameters: [objectIdParameter('productId')],
            requestBody: jsonRequest({ type: 'object', additionalProperties: true }),
            responses: { 200: shopObjectResponse }
        },
        delete: {
            tags: ['Cart'], summary: 'Xóa dòng giỏ', security: bearerSecurity,
            parameters: [objectIdParameter('productId')], responses: { 200: shopObjectResponse }
        }
    },
    [`${API_PREFIX}/orders`]: {
        post: {
            tags: ['Orders'], summary: 'Checkout và tạo đơn', security: bearerSecurity,
            parameters: [{
                in: 'header', name: 'Idempotency-Key', required: true, schema: { type: 'string' }
            }],
            requestBody: jsonRequest({ type: 'object', required: ['customer', 'shippingAddress'] }),
            responses: { 201: shopObjectResponse, 409: errorResponse('Giỏ hàng hoặc tồn kho đã thay đổi.') }
        }
    },
    [`${API_PREFIX}/orders/me`]: {
        get: {
            tags: ['Orders'], summary: 'Lịch sử đơn của user', security: bearerSecurity,
            responses: { 200: shopListResponse }
        }
    },
    [`${API_PREFIX}/orders/{id}`]: {
        get: {
            tags: ['Orders'], summary: 'Chi tiết đơn của user', security: bearerSecurity,
            parameters: [objectIdParameter('id')], responses: { 200: shopObjectResponse }
        }
    },
    [`${API_PREFIX}/payments/payos`]: {
        post: {
            tags: ['Payments'], summary: 'Tạo payment link payOS', security: bearerSecurity,
            requestBody: jsonRequest({
                type: 'object', required: ['orderId'], properties: { orderId: { type: 'string' } }
            }),
            responses: { 200: shopObjectResponse, 410: errorResponse('Đơn đã hết hạn.') }
        }
    },
    [`${API_PREFIX}/payments/payos/webhook`]: {
        post: {
            tags: ['Payments'], summary: 'Webhook payOS đã ký',
            requestBody: jsonRequest({ type: 'object', additionalProperties: true }),
            responses: { 200: shopObjectResponse, 400: errorResponse('Chữ ký webhook không hợp lệ.') }
        }
    },
    [`${API_PREFIX}/payments/{orderId}/status`]: {
        get: {
            tags: ['Payments'], summary: 'Trạng thái thanh toán', security: bearerSecurity,
            parameters: [objectIdParameter('orderId')], responses: { 200: shopObjectResponse }
        }
    },
    [`${API_PREFIX}/admin/products`]: {
        get: {
            tags: ['Admin Shop'], summary: 'Danh sách sản phẩm quản trị', security: bearerSecurity,
            responses: { 200: shopListResponse }
        },
        post: {
            tags: ['Admin Shop'], summary: 'Tạo sản phẩm', security: bearerSecurity,
            requestBody: jsonRequest({ type: 'object', required: ['name', 'price', 'stock'] }),
            responses: { 201: shopObjectResponse }
        }
    },
    [`${API_PREFIX}/admin/uploads/product-images/presign`]: {
        post: {
            tags: ['Admin Shop'],
            summary: 'Tạo presigned URL để admin tải ảnh sản phẩm thẳng lên R2',
            security: bearerSecurity,
            requestBody: jsonRequest({
                type: 'object',
                required: ['fileName', 'contentType', 'size'],
                additionalProperties: false,
                properties: {
                    fileName: { type: 'string', maxLength: 255 },
                    contentType: {
                        type: 'string',
                        enum: ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
                    },
                    size: { type: 'integer', minimum: 1, maximum: 5242880 }
                }
            }),
            responses: {
                201: shopObjectResponse,
                422: errorResponse('Ảnh không đúng định dạng hoặc vượt quá 5 MB.')
            }
        }
    },
    [`${API_PREFIX}/admin/products/{id}`]: {
        get: {
            tags: ['Admin Shop'], summary: 'Chi tiết sản phẩm quản trị', security: bearerSecurity,
            parameters: [objectIdParameter('id')], responses: { 200: shopObjectResponse }
        },
        patch: {
            tags: ['Admin Shop'], summary: 'Cập nhật sản phẩm', security: bearerSecurity,
            parameters: [objectIdParameter('id')],
            requestBody: jsonRequest({ type: 'object', required: ['expectedUpdatedAt'] }),
            responses: { 200: shopObjectResponse, 409: errorResponse('Concurrent update.') }
        }
    },
    [`${API_PREFIX}/admin/orders`]: {
        get: {
            tags: ['Admin Shop'], summary: 'Danh sách đơn quản trị', security: bearerSecurity,
            responses: { 200: shopListResponse }
        }
    },
    [`${API_PREFIX}/admin/orders/{id}`]: {
        get: {
            tags: ['Admin Shop'], summary: 'Chi tiết đơn quản trị', security: bearerSecurity,
            parameters: [objectIdParameter('id')], responses: { 200: shopObjectResponse }
        }
    },
    [`${API_PREFIX}/admin/orders/{id}/status`]: {
        patch: {
            tags: ['Admin Shop'], summary: 'Cập nhật trạng thái đơn', security: bearerSecurity,
            parameters: [objectIdParameter('id')],
            requestBody: jsonRequest({ type: 'object', required: ['status', 'expectedUpdatedAt'] }),
            responses: { 200: shopObjectResponse, 409: errorResponse('Bước chuyển không hợp lệ.') }
        }
    },
    [`${API_PREFIX}/admin/dashboard`]: {
        get: {
            tags: ['Admin'], summary: 'Tổng quan vận hành và doanh thu', security: bearerSecurity,
            responses: { 200: shopObjectResponse }
        }
    },
    [`${API_PREFIX}/admin/users`]: {
        get: {
            tags: ['Admin'], summary: 'Danh sách tài khoản', security: bearerSecurity,
            responses: { 200: shopListResponse }
        }
    },
    [`${API_PREFIX}/admin/users/{id}`]: {
        get: {
            tags: ['Admin'], summary: 'Chi tiết tài khoản và lịch sử đơn gần đây', security: bearerSecurity,
            parameters: [objectIdParameter('id')], responses: { 200: shopObjectResponse }
        }
    },
    [`${API_PREFIX}/admin/users/{id}/status`]: {
        patch: {
            tags: ['Admin'], summary: 'Cập nhật trạng thái tài khoản', security: bearerSecurity,
            parameters: [objectIdParameter('id')],
            requestBody: jsonRequest({
                type: 'object',
                required: ['status', 'expectedUpdatedAt'],
                properties: {
                    status: { type: 'string', enum: ['pending_verification', 'active', 'blocked'] },
                    expectedUpdatedAt: { type: 'string', format: 'date-time' }
                }
            }),
            responses: { 200: shopObjectResponse, 409: errorResponse('Không thể đổi trạng thái.') }
        }
    },
    [`${API_PREFIX}/admin/posts`]: {
        get: {
            tags: ['Admin'], summary: 'Danh sách luật chơi', security: bearerSecurity,
            responses: { 200: shopListResponse }
        },
        post: {
            tags: ['Admin'], summary: 'Tạo luật chơi', security: bearerSecurity,
            requestBody: jsonRequest({
                type: 'object',
                required: ['productId', 'title', 'summary', 'content']
            }),
            responses: { 201: shopObjectResponse }
        }
    },
    [`${API_PREFIX}/admin/posts/{id}`]: {
        get: {
            tags: ['Admin'], summary: 'Chi tiết luật chơi', security: bearerSecurity,
            parameters: [objectIdParameter('id')], responses: { 200: shopObjectResponse }
        },
        patch: {
            tags: ['Admin'], summary: 'Cập nhật luật chơi', security: bearerSecurity,
            parameters: [objectIdParameter('id')],
            requestBody: jsonRequest({ type: 'object', required: ['expectedUpdatedAt'] }),
            responses: { 200: shopObjectResponse, 409: errorResponse('Concurrent update.') }
        },
        delete: {
            tags: ['Admin'], summary: 'Xóa luật chơi', security: bearerSecurity,
            parameters: [objectIdParameter('id')],
            requestBody: jsonRequest({ type: 'object', required: ['expectedUpdatedAt'] }),
            responses: { 200: shopObjectResponse, 409: errorResponse('Concurrent update.') }
        }
    },
    [`${API_PREFIX}/admin/heritage-sites`]: {
        get: {
            tags: ['Admin'], summary: 'Danh sách nội dung địa danh', security: bearerSecurity,
            responses: { 200: shopListResponse }
        },
        post: {
            tags: ['Admin'], summary: 'Tạo nội dung địa danh', security: bearerSecurity,
            requestBody: jsonRequest({
                type: 'object',
                required: ['name', 'shortDescription', 'content', 'targetImageUrl']
            }),
            responses: { 201: shopObjectResponse }
        }
    },
    [`${API_PREFIX}/admin/heritage-sites/{id}`]: {
        get: {
            tags: ['Admin'], summary: 'Chi tiết nội dung địa danh', security: bearerSecurity,
            parameters: [objectIdParameter('id')], responses: { 200: shopObjectResponse }
        },
        patch: {
            tags: ['Admin'], summary: 'Cập nhật nội dung địa danh', security: bearerSecurity,
            parameters: [objectIdParameter('id')],
            requestBody: jsonRequest({ type: 'object', required: ['expectedUpdatedAt'] }),
            responses: { 200: shopObjectResponse, 409: errorResponse('Concurrent update.') }
        },
        delete: {
            tags: ['Admin'], summary: 'Xóa địa danh chưa gắn model AR', security: bearerSecurity,
            parameters: [objectIdParameter('id')],
            requestBody: jsonRequest({ type: 'object', required: ['expectedUpdatedAt'] }),
            responses: { 200: shopObjectResponse, 409: errorResponse('Địa danh đang được sử dụng.') }
        }
    },
    [`${API_PREFIX}/admin/heritage-sites/{id}/questions`]: {
        get: {
            tags: ['Admin'], summary: 'Danh sách câu hỏi public của địa danh',
            security: bearerSecurity,
            parameters: [objectIdParameter('id')],
            responses: { 200: shopObjectResponse }
        },
        post: {
            tags: ['Admin'], summary: 'Tạo câu hỏi public cho địa danh',
            security: bearerSecurity,
            parameters: [objectIdParameter('id')],
            requestBody: jsonRequest({
                type: 'object', required: ['content'],
                properties: { content: { type: 'string', minLength: 3, maxLength: 500 } }
            }),
            responses: { 201: shopObjectResponse }
        }
    },
    [`${API_PREFIX}/admin/heritage-sites/{id}/questions/{questionId}`]: {
        patch: {
            tags: ['Admin'], summary: 'Cập nhật câu hỏi public',
            security: bearerSecurity,
            parameters: [objectIdParameter('id'), objectIdParameter('questionId')],
            requestBody: jsonRequest({
                type: 'object', required: ['content', 'expectedUpdatedAt']
            }),
            responses: { 200: shopObjectResponse, 409: errorResponse('Concurrent update.') }
        },
        delete: {
            tags: ['Admin'], summary: 'Xóa câu hỏi public',
            security: bearerSecurity,
            parameters: [objectIdParameter('id'), objectIdParameter('questionId')],
            requestBody: jsonRequest({ type: 'object', required: ['expectedUpdatedAt'] }),
            responses: { 200: shopObjectResponse, 409: errorResponse('Concurrent update.') }
        }
    },
    [`${API_PREFIX}/admin/models`]: {
        get: {
            tags: ['Admin'], summary: 'Danh sách model AR', security: bearerSecurity,
            responses: { 200: shopListResponse }
        },
        post: {
            tags: ['Admin'], summary: 'Tạo cấu hình model AR', security: bearerSecurity,
            requestBody: jsonRequest({
                type: 'object', required: ['heritageSiteId', 'model3dUrl']
            }),
            responses: { 201: shopObjectResponse }
        }
    },
    [`${API_PREFIX}/admin/models/{id}`]: {
        get: {
            tags: ['Admin'], summary: 'Chi tiết model AR', security: bearerSecurity,
            parameters: [objectIdParameter('id')], responses: { 200: shopObjectResponse }
        },
        patch: {
            tags: ['Admin'], summary: 'Cập nhật cấu hình model AR', security: bearerSecurity,
            parameters: [objectIdParameter('id')],
            requestBody: jsonRequest({ type: 'object', required: ['expectedUpdatedAt'] }),
            responses: { 200: shopObjectResponse, 409: errorResponse('Concurrent update.') }
        },
        delete: {
            tags: ['Admin'], summary: 'Đánh dấu model AR đã xóa', security: bearerSecurity,
            parameters: [objectIdParameter('id')],
            requestBody: jsonRequest({ type: 'object', required: ['expectedUpdatedAt'] }),
            responses: { 200: shopObjectResponse, 409: errorResponse('Concurrent update.') }
        }
    }
});

const swaggerSpec = swaggerJSDoc({
    definition: swaggerDefinition,
    apis: []
});

export default swaggerSpec;
