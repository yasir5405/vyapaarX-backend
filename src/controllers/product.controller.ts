import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiResponse, PaginatedResponse } from "../schemas/common.response";
import {
  getProductBySlugValidation,
  productValidationSchema,
  searchProductByIdValidation,
  updateProductValidationSchema,
} from "../validations/product.validation";
import slugify from "slugify";

export const addProduct = async (req: Request, res: Response) => {
  const parsedBody = productValidationSchema.safeParse(req.body);

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

  const { name, price, description, companyName, highlights, categoryId } =
    parsedBody.data;

  try {
    let baseSlug = slugify(name, {
      lower: true,
      strict: true,
    });

    let slug = baseSlug;
    let count = 1;

    while (true) {
      const existing = await prisma.product.findUnique({
        where: { slug },
      });

      if (!existing) break;

      slug = `${baseSlug}-${count}`;
      count++;
    }
    const product = await prisma.product.create({
      data: {
        name,
        price,
        description,
        companyName,
        highlights,
        categoryId,
        slug,
      },
    });

    const response: ApiResponse<typeof product> = {
      data: product,
      message: "Product added successfully",
      success: true,
    };

    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error adding product. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };
    return res.status(500).json(response);
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;

    if (
      Number.isNaN(limit) ||
      (req.query.cursor !== undefined && Number.isNaN(cursor))
    ) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Invalid limit and cursor",
        success: false,
      };

      return res.status(400).json(response);
    }

    const products = await prisma.product.findMany({
      take: limit,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      where: {
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    const nextCursor =
      products.length === limit ? products[products.length - 1].id : null;

    const response: PaginatedResponse<typeof products> = {
      success: true,
      message: "Products fetched successfully",
      data: products,
      nextCursor: nextCursor,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error fetching products. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };
    return res.status(500).json(response);
  }
};

export const getProduct = async (req: Request, res: Response) => {
  const parsedBody = searchProductByIdValidation.safeParse(req.params);

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

  const { productId } = parsedBody.data;

  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Product not found",
        success: false,
      };

      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof product> = {
      data: product,
      message: "Product fetched successfully",
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error fetching product. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };
    return res.status(500).json(response);
  }
};

export const getProductBySlug = async (req: Request, res: Response) => {
  const parsedBody = getProductBySlugValidation.safeParse(req.params);

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

  const { slug } = parsedBody.data;

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
      },
    });

    if (!product) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Product not found",
        success: false,
      };

      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof product> = {
      data: product,
      message: "Product fetched successfully",
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error fetching product. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };
    return res.status(500).json(response);
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const productId = Number(req.params.productId);

  if (Number.isNaN(productId)) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Product id must be a valid number",
      success: false,
    };

    return res.status(400).json(response);
  }
  try {
    const parsedBody = updateProductValidationSchema.safeParse(req.body);

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
        message: "At least one field must be provided for updating a product",
        success: false,
      };

      return res.status(400).json(response);
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      const response: ApiResponse<null> = {
        data: null,
        message: "No product found",
        success: false,
      };

      return res.status(404).json(response);
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: productId,
      },
      data: parsedBody.data,
    });

    const response: ApiResponse<typeof updatedProduct> = {
      data: updatedProduct,
      message: "Product successfully updated",
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error fetching product. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };
    return res.status(500).json(response);
  }
};

export const getHomeProducts = async (req: Request, res: Response) => {
  try {
    const [categories, newArrivals, menProducts, womenProducts] =
      await Promise.all([
        prisma.category.findMany({
          where: { isActive: true },
          orderBy: { id: "desc" },
          take: 6,
        }),

        prisma.product.findMany({
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: { category: true },
        }),

        prisma.product.findMany({
          where: { isActive: true, category: { slug: "men" } },
          take: 8,
          include: { category: true },
        }),

        prisma.product.findMany({
          where: { isActive: true, category: { slug: "women" } },
          take: 8,
          include: { category: true },
        }),
      ]);

    const responseType = {
      categories,
      newArrivals,
      menProducts,
      womenProducts,
    };

    const response: ApiResponse<typeof responseType> = {
      data: responseType,
      message: "Homepage products fetched successfully",
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Error fetching homepage data. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };
    return res.status(500).json(response);
  }
};
