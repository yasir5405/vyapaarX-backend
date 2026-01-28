import { Request, Response } from "express";
import { ApiResponse } from "../schemas/common.response";
import { prisma } from "../lib/prisma";
import { orderValidationSchema } from "../validations/order.validation";

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
  try {
    const user = req.user!;

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

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await prisma.order.create({
        data: {
          userId: user.id,
          totalAmount,
          addressId: addressId,
          addressSnapShot: addressSnapshot,
        },
      });

      const orderItemsData = cart.cartItems.map((item) => ({
        orderId: createdOrder.id,
        productId: item.productId,
        productName: item.product.name,
        price: item.price,
        quantity: item.quantity,
      }));

      await tx.orderItems.createMany({
        data: orderItemsData,
      });

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      return createdOrder;
    });

    const response: ApiResponse<typeof order> = {
      data: order,
      message: "Order successfully placed",
      success: true,
    };

    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error while placing order. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };

    return res.status(500).json(response);
  }
};
