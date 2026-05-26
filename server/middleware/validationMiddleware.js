const Joi = require('joi');
const ApiError = require('../utils/ApiError');

// Helper function to validate request schemas
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: true
    });
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return next(new ApiError(400, errorMessage));
    }
    req[source] = value;
    next();
  };
};

// Object ID validation helper
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ID format');

const schemas = {
  // Booking schemas
  bookingCreate: Joi.object({
    name: Joi.string().required().messages({
      'any.required': 'Name is required'
    }),
    whatsapp: Joi.string().min(10).required().messages({
      'any.required': 'WhatsApp is required',
      'string.min': 'Invalid WhatsApp number'
    }),
    serviceType: Joi.string().required().messages({
      'any.required': 'Service Type is required'
    }),
    message: Joi.string().allow('', null),
    slot: Joi.string().required().messages({
      'any.required': 'Slot date is required'
    }),
    price: Joi.number().positive().required().messages({
      'any.required': 'Price is required'
    }),
    tenantId: Joi.string().allow('', null)
  }),

  bookingCreateV2: Joi.object({
    name: Joi.string().required().messages({
      'any.required': 'Name is required'
    }),
    whatsapp: Joi.string().min(10).required().messages({
      'any.required': 'WhatsApp is required',
      'string.min': 'Invalid WhatsApp number'
    }),
    items: Joi.array().items(
      Joi.object({
        serviceId: objectId.required(),
        title: Joi.string().required(),
        price: Joi.number().positive().required(),
        quantity: Joi.number().integer().positive().default(1),
        slot: Joi.string().allow('', null),
        message: Joi.string().allow('', null),
        devoteeName: Joi.string().allow('', null),
        devoteeWhatsapp: Joi.string().allow('', null)
      })
    ).min(1).required().messages({
      'any.required': 'Items are required',
      'array.min': 'At least one item is required for booking'
    }),
    totalPrice: Joi.number().positive().required(),
    taxAmount: Joi.number().min(0).default(0),
    serviceType: Joi.string().allow('', null),
    paymentMode: Joi.string().valid('one-time', 'recurring').default('one-time'),
    tenantId: Joi.string().allow('', null),
    walletDeduction: Joi.number().min(0).default(0),
    payableAmount: Joi.number().min(0).default(0)
  }),

  bookingUpdateStatus: Joi.object({
    status: Joi.string().valid('Pending', 'Payment_Verified', 'Completed', 'Cancelled', 'Failed', 'Refund_Requested', 'Refund_Processing', 'Refunded', 'Approved', 'Invoice_Generated', 'Refund_Receipt_Generated').required()
  }),

  // Payment schemas
  paymentCreateOrder: Joi.object({
    amount: Joi.number().positive().required()
  }),

  paymentVerify: Joi.object({
    razorpay_order_id: Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required(),
    purpose: Joi.string().valid('booking', 'wallet_topup').required(),
    amount: Joi.number().positive().when('purpose', {
      is: 'wallet_topup',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),

  paymentVerifyHybrid: Joi.object({
    razorpay_order_id: Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required(),
    purpose: Joi.string().optional(),
    orderId: objectId.optional(),
    bookingDetails: Joi.object({
      name: Joi.string().required(),
      whatsapp: Joi.string().min(10).required(),
      items: Joi.array().items(
        Joi.object({
          serviceId: objectId.required(),
          title: Joi.string().required(),
          price: Joi.number().positive().required(),
          quantity: Joi.number().integer().positive().default(1),
          slot: Joi.string().allow('', null),
          message: Joi.string().allow('', null),
          devoteeName: Joi.string().allow('', null),
          devoteeWhatsapp: Joi.string().allow('', null)
        })
      ).min(1).required(),
      totalPrice: Joi.number().positive().required(),
      taxAmount: Joi.number().min(0).default(0),
      walletDeduction: Joi.number().min(0).default(0),
      payableAmount: Joi.number().min(0).default(0),
      serviceType: Joi.string().allow('', null),
      paymentMode: Joi.string().allow('', null),
      tenantId: Joi.string().allow('', null)
    }).optional()
  }).xor('orderId', 'bookingDetails'),

  paymentPayWithWalletV2: Joi.object({
    name: Joi.string().required(),
    whatsapp: Joi.string().min(10).required(),
    items: Joi.array().items(
      Joi.object({
        serviceId: objectId.required(),
        title: Joi.string().required(),
        price: Joi.number().positive().required(),
        quantity: Joi.number().integer().positive().default(1),
        slot: Joi.string().allow('', null),
        message: Joi.string().allow('', null),
        devoteeName: Joi.string().allow('', null),
        devoteeWhatsapp: Joi.string().allow('', null)
      })
    ).min(1).required(),
    totalPrice: Joi.number().positive().required(),
    taxAmount: Joi.number().min(0).default(0),
    walletDeduction: Joi.number().min(0).default(0),
    payableAmount: Joi.number().min(0).default(0),
    serviceType: Joi.string().allow('', null),
    paymentMode: Joi.string().valid('one-time', 'recurring').default('one-time'),
    tenantId: Joi.string().allow('', null)
  }),

  paymentRecordFailure: Joi.object({
    amount: Joi.number().min(0).optional(),
    reason: Joi.string().allow('', null),
    orderId: objectId.allow('', null),
    type: Joi.string().valid('topup', 'booking').required()
  }),

  // Wallet schemas
  walletSelfTopup: Joi.object({
    amount: Joi.number().positive().required(),
    type: Joi.string().valid('credit', 'debit').required(),
    description: Joi.string().allow('', null)
  }),

  walletAdminAdjustment: Joi.object({
    userId: objectId.required(),
    amount: Joi.number().positive().required(),
    type: Joi.string().valid('credit', 'debit').required(),
    description: Joi.string().allow('', null)
  }),

  walletFreeze: Joi.object({
    userId: objectId.required()
  }),

  // Refund schemas
  refundRequest: Joi.object({
    orderId: objectId.required(),
    reason: Joi.string().required(),
    bankDetails: Joi.string().allow('', null),
    upiId: Joi.string().allow('', null)
  }),

  refundProcess: Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
    adminRemarks: Joi.string().allow('', null),
    method: Joi.string().valid('wallet', 'razorpay', 'manual').when('status', {
      is: 'approved',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  })
};

module.exports = {
  validate,
  schemas
};
