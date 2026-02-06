import { Request, Response } from "express";
import {
  cartValidationSchema,
  updateCartValidationSchema,
} from "../validations/cart.validation";
import { ApiResponse } from "../schemas/common.response";
import { prisma } from "../lib/prisma";

export const addToCart = async (req: Request, res: Response) => {
  const parsedBody = cartValidationSchema.safeParse(req.body);

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

  const { productId, quantity } = parsedBody.data;

  try {
    const user = req.user!;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Product not found",
        success: false,
      };
      return res.status(404).json(response);
    }

    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: {
            increment: quantity,
          },
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.price,
        },
      });
    }
    const respose: ApiResponse<null> = {
      data: null,
      message: "Item added to cart",
      success: true,
    };

    return res.status(200).json(respose);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error adding to cart. Please try again.",
      success: false,
      error: {
        message: "Internal server error",
      },
    };
    return res.status(500).json(response);
  }
};

export const getCart = async (req: Request, res: Response) => {
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

    const response: ApiResponse<typeof cart> = {
      data: cart,
      message: "Cart fetched successfully",
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error getting cart. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };

    return res.status(500).json(response);
  }
};

export const updateCartItems = async (req: Request, res: Response) => {
  const productId = Number(req.params.productId);

  if (!productId || Number.isNaN(productId)) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Please provide a valid product id",
      success: false,
    };

    return res.status(400).json(response);
  }

  const parsedBody = updateCartValidationSchema.safeParse(req.body);

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

  const { quantity } = parsedBody.data;
  try {
    const user = req.user!;

    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!cart) {
      const response: ApiResponse<null> = {
        data: null,
        message: "No cart found",
        success: false,
      };

      return res.status(404).json(response);
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (!cartItem) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Item not found",
        success: false,
      };

      return res.status(404).json(response);
    }

    if (user.id !== cart.userId) {
      const response: ApiResponse<null> = {
        data: null,
        message: "You not authorised to update this cart",
        success: false,
      };

      return res.status(403).json(response);
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: {
          id: cartItem.id,
        },
      });
    } else {
      await prisma.cartItem.update({
        where: {
          id: cartItem.id,
        },
        data: {
          quantity: quantity,
        },
      });
    }

    const response: ApiResponse<null> = {
      data: null,
      message: "Cart updated successfully",
      success: true,
    };

    return res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error updating cart",
      success: false,
      error: {
        message: "Internal server error",
      },
    };

    return res.status(500).json(response);
  }
};

export const deleteCartItems = async (req: Request, res: Response) => {
  const productId = Number(req.params.productId);

  if (Number.isNaN(productId)) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Please provide a valid cart item id",
      success: false,
    };

    return res.status(400).json(response);
  }
  try {
    const user = req.user!;

    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!cart) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Cart not found",
        success: false,
      };

      return res.status(404).json(response);
    }

    if (user.id !== cart.userId) {
      const response: ApiResponse<null> = {
        data: null,
        message: "You not authorised to update this cart",
        success: false,
      };

      return res.status(403).json(response);
    }

    await prisma.cartItem.delete({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId,
        },
      },
    });

    const response: ApiResponse<null> = {
      data: null,
      message: "Item removed from cart successfully",
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error deleting item from cart",
      success: false,
      error: {
        message: "Internal server error",
      },
    };

    return res.status(500).json(response);
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!cart) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Cart not found",
        success: false,
      };

      return res.status(404).json(response);
    }

    if (user.id !== cart.userId) {
      const response: ApiResponse<null> = {
        data: null,
        message: "You not authorised to update this cart",
        success: false,
      };

      return res.status(403).json(response);
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    const response: ApiResponse<null> = {
      data: null,
      message: "Cart cleared successfully",
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error clearing cart",
      success: false,
      error: {
        message: "Internal server error",
      },
    };

    return res.status(500).json(response);
  }
};
