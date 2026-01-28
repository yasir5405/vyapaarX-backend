import { Request, Response } from "express";
import { ApiResponse } from "../schemas/common.response";
import {
  addressValidationSchema,
  updateAddressValidationSchema,
} from "../validations/address.validation";
import { prisma } from "../lib/prisma";

export const addAddress = async (req: Request, res: Response) => {
  const parsedBody = addressValidationSchema.safeParse(req.body);

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

  const { addressLine, city, country, postalCode, state } = parsedBody.data;

  try {
    const user = req.user!;

    const address = await prisma.address.create({
      data: {
        addressLine,
        city,
        country,
        postalCode,
        state,
        userId: user.id,
      },
    });

    const response: ApiResponse<typeof address> = {
      data: address,
      message: "Address added successfully",
      success: true,
    };

    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error adding address. Please try again.",
      success: false,
      error: {
        message: "Internal server error",
      },
    };
    return res.status(500).json(response);
  }
};

export const getAddresses = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const addresses = await prisma.address.findMany({
      where: {
        userId: user.id,
      },
    });

    const response: ApiResponse<typeof addresses> = {
      data: addresses,
      message: "Addresses fetched successfully",
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error fetching addresses. Please try again.",
      success: false,
      error: {
        message: "Internal server error",
      },
    };
    return res.status(500).json(response);
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  const addressId = Number(req.params.id);

  if (Number.isNaN(addressId)) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Invalid address id",
      success: false,
    };

    return res.status(400).json(response);
  }

  const parsedBody = updateAddressValidationSchema.safeParse(req.body);

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

  if (Object.keys(parsedBody.data).length === 0) {
    const response: ApiResponse<null> = {
      data: null,
      message: "At least one field must be provided for updating address",
      success: false,
    };

    return res.status(400).json(response);
  }

  try {
    const user = req.user!;

    const address = await prisma.address.findUnique({
      where: {
        id: +addressId,
      },
    });

    if (!address) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Address not found",
        success: false,
      };

      return res.status(404).json(response);
    }

    if (address.userId !== user.id) {
      const response: ApiResponse<null> = {
        data: null,
        message: "You are not allowed to update this address",
        success: false,
      };

      return res.status(403).json(response);
    }

    await prisma.address.update({
      where: {
        id: addressId,
      },
      data: parsedBody.data,
    });

    const response: ApiResponse<null> = {
      data: null,
      message: "Address updated successfully.",
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error updating address. Please try again.",
      success: false,
      error: {
        message: "Internal server error",
      },
    };
    return res.status(500).json(response);
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  const addressId = Number(req.params.id);

  if (Number.isNaN(addressId)) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Invalid address id",
      success: false,
    };

    return res.status(400).json(response);
  }

  try {
    const user = req.user!;

    const address = await prisma.address.findUnique({
      where: {
        id: addressId,
      },
    });

    if (!address) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Address not found",
        success: false,
      };

      return res.status(404).json(response);
    }

    if (user.id !== address.userId) {
      const response: ApiResponse<null> = {
        data: null,
        message: "You are not allowed to delete this address",
        success: false,
      };

      return res.status(403).json(response);
    }

    const deletedAddress = await prisma.address.delete({
      where: {
        id: addressId,
      },
    });

    const response: ApiResponse<typeof deletedAddress> = {
      data: deletedAddress,
      message: "Address deleted successfully",
      success: true,
    };

    return res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error deleting address. Please try again.",
      success: false,
      error: {
        message: "Internal server error",
      },
    };
    return res.status(500).json(response);
  }
};

export const setDefaultAddress = async (req: Request, res: Response) => {
  const addressId = Number(req.params.id);

  if (Number.isNaN(addressId)) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Invalid address id",
      success: false,
    };

    return res.status(400).json(response);
  }

  try {
    const user = req.user!;

    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Address not found",
        success: false,
      };

      return res.status(404).json(response);
    }

    if (address.userId !== user.id) {
      const response: ApiResponse<null> = {
        data: null,
        message: "You are not to modify this address",
        success: false,
      };

      return res.status(403).json(response);
    }

    await prisma.$transaction([
      prisma.address.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      }),

      prisma.address.update({
        where: {
          id: addressId,
        },
        data: {
          isDefault: true,
        },
      }),
    ]);

    const response: ApiResponse<null> = {
      data: null,
      message: "Default address updated successfully",
      success: true,
    };

    return res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Failed to set default address",
      success: false,
      error: {
        message: "Internal server error",
      },
    };

    return res.status(500).json(response);
  }
};
