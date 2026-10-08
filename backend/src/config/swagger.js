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
        { name: 'Auth', description: 'Đăng ký, đăng nhập và quản lý phiên' }
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
                            expiresInSeconds: { type: 'integer', example: 600 }
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
                    409: errorResponse('Email đã thuộc một tài khoản khác.'),
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

const swaggerSpec = swaggerJSDoc({
    definition: swaggerDefinition,
    apis: []
});

export default swaggerSpec;
