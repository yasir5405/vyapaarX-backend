import { Request, Response } from "express";
import { ApiResponse } from "../schemas/common.response";
import {
  orderDetailsValidationSchema,
  orderValidationSchema,
  updateOrderStatusValidationSchema,
} from "../validations/order.validation";
import { razorpay } from "../lib/razorpay";
import { prisma } from "../lib/prisma";
import crypto from "crypto";

export const addOrder = async (req: Request, res: Response) => {
  const parsedBody = orderValidationSchema.safeParse(req.body);

  if (!parsedBody.success) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Invalid data format",
      success: false,
      error: {
        message: parsedBody.error.issues[0].message,
      },
    };

    return res.status(400).json(response);
  }

  const { addressId } = parsedBody.data;
  const user = req.user!;

  try {
    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        cartItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.cartItems.length === 0) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Please add items to your cart for placing order",
        success: false,
      };

      return res.status(404).json(response);
    }

    const productIds = cart.cartItems.map((product) => product.productId);

    const activeProducts = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (productIds.length !== activeProducts.length) {
      const response: ApiResponse<null> = {
        data: null,
        message:
          "One or more products in your cart are no longer available. Please review your cart.",
        success: false,
      };

      return res.status(400).json(response);
    }

    const address = await prisma.address.findUnique({
      where: {
        id: addressId,
      },
    });

    if (!address || address.userId !== user.id) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Invalid address",
        success: false,
      };
      return res.status(400).json(response);
    }

    const addressSnapshot = {
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    };

    let totalAmount = 0;

    for (const item of cart.cartItems) {
      totalAmount += item.price * item.quantity;
    }

    totalAmount += 23; //Platform FEE

    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `order_${Date.now()}`,
    });

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId: user.id,
          totalAmount,
          addressId: addressId,
          addressSnapShot: addressSnapshot,
          status: "PENDING",
          razorpayOrderId: razorpayOrder.id,
        },
      });

      const items = cart.cartItems.map((item) => ({
        orderId: createdOrder.id,
        productId: item.productId,
        productName: item.product.name,
        price: item.price,
        quantity: item.quantity,
      }));

      await tx.orderItems.createMany({
        data: items,
      });

      return createdOrder;
    });

    type OrderResponseType = {
      orderId: number;
      razorpayOrderId: string;
      amount: number | string;
      currency: string;
    };

    const response: ApiResponse<OrderResponseType> = {
      data: {
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      message: "Order created. Proceed to payment.",
      success: true,
    };

    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error while creating order. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };

    return res.status(500).json(response);
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  const user = req.user!;

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  try {
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await prisma.order.update({
        where: {
          razorpayOrderId: razorpay_order_id,
        },
        data: {
          status: "FAILED",
        },
      });

      const response: ApiResponse<null> = {
        data: null,
        message: "Payment verification failed",
        success: false,
        error: {
          message: "Payment verification failed",
        },
      };

      return res.status(400).json(response);
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: {
          razorpayOrderId: razorpay_order_id,
        },
        data: {
          status: "PAID",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
      });

      await tx.cartItem.deleteMany({
        where: {
          cart: { userId: user.id },
        },
      });
    });

    const response: ApiResponse<null> = {
      data: null,
      message: "Payment verified. Order confirmed",
      success: true,
    };

    return res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error during payment verification. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };

    return res.status(500).json(response);
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;

    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await prisma.$transaction([
      prisma.order.findMany({
        where: {
          userId: user.id,
          status: "PAID",
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      }),

      prisma.order.count({
        where: {
          userId: user.id,
          status: "PAID",
        },
      }),
    ]);

    const responseType = {
      orders: orders,
      totalOrders: totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    };

    const response: ApiResponse<typeof responseType> = {
      data: responseType,
      message: "Orders fetched successfully",
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error in getting orders. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };

    return res.status(500).json(response);
  }
};

export const getOrder = async (req: Request, res: Response) => {
  const parsedBody = orderDetailsValidationSchema.safeParse(req.params);

  if (!parsedBody.success) {
    const respose: ApiResponse<null> = {
      data: null,
      message: "Invalid data format",
      success: false,
      error: {
        message: parsedBody.error.issues[0].message,
      },
    };

    return res.status(400).json(respose);
  }

  const { orderId } = parsedBody.data;

  try {
    const user = req.user!;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Order does not exist",
        success: false,
      };

      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof order> = {
      data: order,
      message: "Order details fetched successfully",
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error in getting order. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };

    return res.status(500).json(response);
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const [orders, totalOrders] = await prisma.$transaction([
      prisma.order.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.order.count(),
    ]);

    const responseBody = {
      totalOrders,
      orders,
    };

    if (orders.length === 0) {
      const response: ApiResponse<typeof responseBody> = {
        data: {
          orders: [],
          totalOrders: 0,
        },
        message: "No orders found",
        success: false,
      };

      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof responseBody> = {
      data: responseBody,
      message: "Orders fertched successfully",
      success: true,
    };

    return res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error in getting orders. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };

    return res.status(500).json(response);
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const orderId = Number(req.params.orderId);

  if (Number.isNaN(orderId)) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Order id must be valid",
      success: false,
    };

    return res.status(400).json(response);
  }

  const parsedBody = updateOrderStatusValidationSchema.safeParse(req.body);

  if (!parsedBody.success) {
    const respose: ApiResponse<null> = {
      data: null,
      message: "Invalid data format",
      success: false,
      error: {
        message: parsedBody.error.issues[0].message,
      },
    };

    return res.status(400).json(respose);
  }

  const { status } = parsedBody.data;

  try {
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Order not found",
        success: false,
      };

      return res.status(404).json(response);
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: status,
      },
    });

    const response: ApiResponse<typeof updatedOrder> = {
      data: updatedOrder,
      message: "Order status updated successfully",
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error in getting orders. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };

    return res.status(500).json(response);
  }
};

export const getAdminOverview = async (req: Request, res: Response) => {
  try {
    const [productCount, orderCount, userCount, revenue] =
      await prisma.$transaction([
        prisma.product.count(),
        prisma.order.count(),
        prisma.user.count(),
        prisma.order.aggregate({
          where: { status: "PAID" },
          _sum: { totalAmount: true },
        }),
      ]);

    type res = {
      productCount: number;
      orderCount: number;
      userCount: number;
      revenue: number;
    };

    const response: ApiResponse<res> = {
      data: {
        orderCount,
        productCount,
        revenue: revenue._sum.totalAmount ?? 0,
        userCount,
      },
      message: "Admin overview fetched successfully",
      success: true,
    };
    return res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error in getting admin overview. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };

    return res.status(500).json(response);
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  const orderId = Number(req.params.orderId);

  if (Number.isNaN(orderId)) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Order id must be valid",
      success: false,
    };

    return res.status(400).json(response);
  }

  const userId = req.user!.id;

  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Order not found",
        success: false,
      };

      return res.status(404).json(response);
    }

    if (order.status !== "PENDING") {
      const response: ApiResponse<null> = {
        data: null,
        message: "Only pending orders can be cancelled",
        success: false,
      };

      return res.status(404).json(response);
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    const response: ApiResponse<null> = {
      data: null,
      message: "Order cancelled",
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error cancelling order. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };

    return res.status(500).json(response);
  }
};
