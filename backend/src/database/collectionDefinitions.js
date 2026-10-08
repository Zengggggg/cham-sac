const timestampProperties = {
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: 'date' }
};

const nonNegativeInteger = {
    bsonType: ['int', 'long', 'double', 'decimal'],
    minimum: 0,
    multipleOf: 1
};

const positiveInteger = {
    bsonType: ['int', 'long', 'double', 'decimal'],
    minimum: 1,
    multipleOf: 1
};

const httpsUrl = {
    bsonType: 'string',
    pattern: '^https://[^\\s]+$'
};

const vector = {
    bsonType: 'object',
    required: ['x', 'y', 'z'],
    properties: {
        x: { bsonType: ['int', 'long', 'double', 'decimal'] },
        y: { bsonType: ['int', 'long', 'double', 'decimal'] },
        z: { bsonType: ['int', 'long', 'double', 'decimal'] }
    }
};

const definition = (name, required, properties, indexes) => ({
    name,
    options: {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required,
                properties
            }
        },
        validationLevel: 'strict',
        validationAction: 'error'
    },
    indexes
});

export const collectionDefinitions = [
    definition('users', ['name', 'email', 'role', 'status', 'createdAt', 'updatedAt'], {
        name: { bsonType: 'string', minLength: 2, maxLength: 100 },
        fullName: { bsonType: 'string', minLength: 2, maxLength: 100 },
        email: { bsonType: 'string', maxLength: 254 },
        phone: { bsonType: 'string', pattern: '^\\+[1-9][0-9]{7,14}$' },
        passwordHash: { bsonType: ['string', 'null'] },
        googleId: { bsonType: ['string', 'null'] },
        role: { enum: ['user', 'admin'] },
        status: { enum: ['pending_verification', 'active', 'blocked'] },
        emailVerifiedAt: { bsonType: ['date', 'null'] },
        emailVerificationOtpHash: { bsonType: ['string', 'null'] },
        emailVerificationOtpExpiresAt: { bsonType: ['date', 'null'] },
        emailVerificationOtpAttempts: nonNegativeInteger,
        emailVerificationOtpSentAt: { bsonType: ['date', 'null'] },
        refreshTokenHash: { bsonType: ['string', 'null'] },
        refreshTokenExpiresAt: { bsonType: ['date', 'null'] },
        ...timestampProperties
    }, [
        { key: { email: 1 }, options: { unique: true, name: 'email_1' } },
        {
            key: { phone: 1 },
            options: {
                unique: true,
                name: 'phone_1',
                partialFilterExpression: { phone: { $type: 'string' } }
            }
        }
    ]),
    definition('products', ['name', 'price', 'stock', 'status', 'createdAt', 'updatedAt'], {
        name: { bsonType: 'string', minLength: 2, maxLength: 200 },
        description: { bsonType: 'string', maxLength: 5000 },
        price: nonNegativeInteger,
        stock: nonNegativeInteger,
        images: { bsonType: 'array', items: httpsUrl },
        status: { enum: ['active', 'inactive', 'sold_out'] },
        ...timestampProperties
    }, [
        {
            key: { status: 1, createdAt: -1 },
            options: { name: 'status_1_createdAt_-1' }
        }
    ]),
    definition(
        'heritage_sites',
        ['name', 'shortDescription', 'content', 'targetImageUrl', 'createdAt', 'updatedAt'],
        {
            name: { bsonType: 'string', minLength: 2, maxLength: 200 },
            shortDescription: { bsonType: 'string', maxLength: 1000 },
            content: { bsonType: 'string', maxLength: 100000 },
            targetImageUrl: httpsUrl,
            ...timestampProperties
        },
        [{
            key: { targetImageUrl: 1 },
            options: { unique: true, name: 'targetImageUrl_1' }
        }]
    ),
    definition(
        'orders',
        [
            'orderCode',
            'customer',
            'shippingAddress',
            'items',
            'shippingFee',
            'totalAmount',
            'paymentStatus',
            'orderStatus',
            'createdAt',
            'updatedAt'
        ],
        {
            orderCode: { bsonType: 'string', minLength: 3, maxLength: 50 },
            userId: { bsonType: 'objectId' },
            customer: {
                bsonType: 'object',
                required: ['fullName', 'phone'],
                properties: {
                    fullName: { bsonType: 'string', minLength: 2, maxLength: 100 },
                    phone: { bsonType: 'string', pattern: '^\\+[1-9][0-9]{7,14}$' },
                    email: { bsonType: 'string', maxLength: 254 }
                }
            },
            shippingAddress: {
                bsonType: 'object',
                required: ['addressLine', 'province'],
                properties: {
                    addressLine: { bsonType: 'string', maxLength: 500 },
                    ward: { bsonType: 'string', maxLength: 200 },
                    province: { bsonType: 'string', maxLength: 200 },
                    note: { bsonType: 'string', maxLength: 1000 }
                }
            },
            items: {
                bsonType: 'array',
                minItems: 1,
                items: {
                    bsonType: 'object',
                    required: ['productId', 'productName', 'quantity', 'unitPrice'],
                    properties: {
                        productId: { bsonType: 'objectId' },
                        productName: { bsonType: 'string', maxLength: 200 },
                        quantity: positiveInteger,
                        unitPrice: nonNegativeInteger,
                        isBox: { bsonType: 'bool' }
                    }
                }
            },
            shippingFee: nonNegativeInteger,
            totalAmount: nonNegativeInteger,
            paymentStatus: { enum: ['unpaid', 'paid', 'refunded'] },
            orderStatus: { enum: ['pending', 'confirmed', 'shipping', 'done', 'cancelled'] },
            ...timestampProperties
        },
        [
            { key: { orderCode: 1 }, options: { unique: true, name: 'orderCode_1' } },
            {
                key: { userId: 1, createdAt: -1 },
                options: { name: 'userId_1_createdAt_-1' }
            },
            {
                key: { orderStatus: 1, createdAt: -1 },
                options: { name: 'orderStatus_1_createdAt_-1' }
            }
        ]
    ),
    definition(
        'ar_models',
        [
            'heritageSiteId',
            'model3dUrl',
            'defaultScale',
            'defaultPosition',
            'status',
            'createdAt',
            'updatedAt'
        ],
        {
            heritageSiteId: { bsonType: 'objectId' },
            model3dUrl: {
                bsonType: 'string',
                pattern: '^https://[^\\s?#]+\\.glb(?:[?#][^\\s]*)?$'
            },
            defaultScale: {
                bsonType: ['int', 'long', 'double', 'decimal'],
                minimum: 0,
                exclusiveMinimum: true
            },
            defaultPosition: vector,
            defaultRotation: vector,
            thumbnail: httpsUrl,
            status: { enum: ['draft', 'published', 'hidden', 'deleted'] },
            ...timestampProperties
        },
        [
            {
                key: { heritageSiteId: 1 },
                options: { unique: true, name: 'heritageSiteId_1' }
            },
            { key: { status: 1 }, options: { name: 'status_1' } }
        ]
    ),
    definition(
        'game_rules',
        ['productId', 'title', 'summary', 'content', 'createdAt', 'updatedAt'],
        {
            productId: { bsonType: 'objectId' },
            title: { bsonType: 'string', maxLength: 300 },
            summary: { bsonType: 'string', maxLength: 2000 },
            content: { bsonType: 'string', maxLength: 100000 },
            coverImageUrl: httpsUrl,
            ...timestampProperties
        },
        [{ key: { productId: 1 }, options: { unique: true, name: 'productId_1' } }]
    ),
    definition(
        'payments',
        [
            'orderId',
            'provider',
            'providerOrderCode',
            'amount',
            'transferContent',
            'status',
            'createdAt',
            'updatedAt'
        ],
        {
            orderId: { bsonType: 'objectId' },
            provider: { enum: ['payos'] },
            providerOrderCode: positiveInteger,
            paymentLinkId: { bsonType: 'string', maxLength: 200 },
            amount: nonNegativeInteger,
            transferContent: { bsonType: 'string', minLength: 1, maxLength: 255 },
            status: { enum: ['pending', 'success', 'failed'] },
            webhookPayload: { bsonType: 'object' },
            providerTransactionId: { bsonType: 'string', maxLength: 255 },
            paidAt: { bsonType: 'date' },
            ...timestampProperties
        },
        [
            {
                key: { orderId: 1, createdAt: -1 },
                options: { name: 'orderId_1_createdAt_-1' }
            },
            {
                key: { provider: 1, providerTransactionId: 1 },
                options: {
                    unique: true,
                    name: 'provider_1_providerTransactionId_1',
                    partialFilterExpression: { providerTransactionId: { $type: 'string' } }
                }
            },
            { key: { transferContent: 1 }, options: { name: 'transferContent_1' } },
            {
                key: { providerOrderCode: 1 },
                options: { unique: true, name: 'providerOrderCode_1' }
            },
            {
                key: { paymentLinkId: 1 },
                options: {
                    unique: true,
                    name: 'paymentLinkId_1',
                    partialFilterExpression: { paymentLinkId: { $type: 'string' } }
                }
            }
        ]
    )
];
