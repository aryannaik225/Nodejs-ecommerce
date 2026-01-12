import prisma from "./prisma.js";

export const find = async () => {
  try {
    const products = await prisma.products.findMany();
    return products;
  } catch (error) {
    console.log("Error occured while fetching all records. Error = ", error)
    throw error;
  }
}

export const findById = async (id) => {
  try {
    const product = await prisma.products.findUnique({
      where: {
        id: Number(id),
      }
    })
    return product;
  } catch (error) {
    console.log("Error occured while fetching record by id for " + id + ". Error = ", error)
    throw error;
  }
}

export const create = async (title, description, price, image) => {
  try {
    const newProduct = await prisma.products.create({
      data: {
        title: title,
        description: description,
        price: Number(price),
        image: image,
      },
    });
    return newProduct;
  } catch (error) {
    console.log("Error occured while creating new record. Error = ", error);
    throw error;
  }
};


export const update = async (title, description, price, id, image) => {
  try {
    const updatedProduct = await prisma.products.update({
      where: {
        id: Number(id),
      },
      data: {
        title: title,
        description: description,
        price: Number(price),
        image: image,
      },
    });
    return updatedProduct;
  } catch (error) {
    console.log("Error occured while updating record for id " + id + ". Error = ", error);
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
    console.log("Error occured while deleting record for id " + id + ". Error = ", error);
    throw error;
  }
};