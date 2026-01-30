import prisma from "../config/prisma.js";

export const findAllCategories = async () => {
  try {
    return await prisma.categories.findMany();
  } catch (error) {
    console.log("Error fetching categories:", error);
    throw error;
  }
};

export const find = async () => {
  try {
    const products = await prisma.products.findMany({
      include: {
        product_categories: {
          include: {
            categories: true,
          },
        },
      },
    });

    return products.map((product) => ({
      ...product,
      categories: product.product_categories.map((pc) => pc.categories),
      product_categories: undefined,
    }));
  } catch (error) {
    console.log("Error fetching products:", error);
    throw error;
  }
};

export const findByID = async (id) => {
  try {
    const product = await prisma.products.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        product_categories: {
          include: {
            categories: true,
          },
        },
      },
    });

    if (!product) return null;

    return {
      ...product,
      categories: product.product_categories.map((pc) => pc.categories),
      product_categories: undefined,
    };
  } catch (error) {
    console.log("Error fetching record by id for " + id + ". Error = ", error);
    throw error;
  }
};

export const create = async (title, description, price, image, categoryIds, stock = 0) => {
  try {
    const newProduct = await prisma.products.create({
      data: {
        title: title,
        description: description,
        price: Number(price),
        image: image,
        stock: Number(stock),
        product_categories: {
          create: categoryIds.map((catId) => ({
            categories: {
              connect: { id: Number(catId) },
            },
          })),
        },
      },
      include: {
        product_categories: {
          include: { categories: true },
        },
      },
    });

    return {
      ...newProduct,
      categories: newProduct.product_categories.map((pc) => pc.categories),
      product_categories: undefined,
    };
  } catch (error) {
    console.log("Error creating new record. Error = ", error);
    throw error;
  }
};

export const update = async (title, description, price, id, image, categoryIds, stock) => {
  try {
    const updatedProduct = await prisma.$transaction(async (tx) => {
      const updateData = {
        title: title,
        description: description,
        price: Number(price),
        stock: Number(stock),
        image: image,
      };

      if (stock !== undefined && stock !== null) {
        updateData.stock = Number(stock);
      }

      await tx.products.update({
        where: { id: Number(id) },
        data: updateData,
      });

      if (categoryIds !== undefined) {
          await tx.product_categories.deleteMany({
            where: { product_id: Number(id) },
          });

          if (categoryIds.length > 0) {
            await tx.product_categories.createMany({
              data: categoryIds.map((catId) => ({
                product_id: Number(id),
                category_id: Number(catId),
              })),
            });
          }
      }

      return await tx.products.findUnique({
        where: { id: Number(id) },
        include: {
          product_categories: {
            include: { categories: true },
          },
        },
      });
    });

    return {
      ...updatedProduct,
      categories: updatedProduct.product_categories.map((pc) => pc.categories),
      product_categories: undefined,
    };
  } catch (error) {
    console.log("Error updating record for id " + id + ". Error = ", error);
    throw error;
  }
};

export const deletee = async (id) => {
  try {
    const deletedProduct = await prisma.products.delete({
      where: {
        id: Number(id),
      },
    });
    return deletedProduct;
  } catch (error) {
    console.log("Error deleting record for id " + id + ". Error = ", error);
    throw error;
  }
};

export const incrementStock = async (id, quantity) => {
  try {
    return await prisma.products.update({
      where: { id: Number(id) },
      data: {
        stock: { increment: Number(quantity) }
      }
    });
  } catch (error) {
    console.log("Error incrementing stock", error);
    throw error;
  }
};

export const decrementStock = async (id, quantity) => {
  try {
    const result = await prisma.products.updateMany({
      where: {
        id: Number(id),
        stock: { gte: Number(quantity) }
      },
      data: {
        stock: { decrement: Number(quantity) }
      }
    });
    
    return result.count > 0;
  } catch (error) {
    console.log("Error decrementing stock", error);
    throw error;
  }
};