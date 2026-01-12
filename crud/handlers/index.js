import { create, find, findByID, update, deletee, findAllCategories } from "../db/queries.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await findAllCategories();
    return res.status(200).json({ categories });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" });
  }
}

export const getAllProducts = async (req, res) => {
  try {
    const products = await find();
    return res.status(200).json({ products })
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occured)" })
  }
}

export const getProduct = async (req, res) => {
  const id = req.params.id;
  try {
    const product = await findByID(id);
    return res.status(200).json({ product })
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occured" })
  }
}

export const createProduct = async (req, res) => {
  const { title, description, price, image, categoryIds=[] } = req.body;

  if (!title || !description || !price) {
    return res.status(403).json({ message: "Input parameters missing." })
  }

  try {
    const product = await create(title, description, price, image, categoryIds);
    return res.status(201).json({ product })
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occured" })
  }
}

export const updateProduct = async (req, res) => {
  const { title, description, price, image, categoryIds=[] } = req.body;
  const id = req.params.id;

  if (!title || !description || !price) {
    return res.status(403).json({ message: "Input parameters missing." })
  }

  try {
    const product = await update(title, description, price, id, image, categoryIds);
    return res.status(201).json({ product })
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occured" })
  }
}

export const deleteProduct = async (req, res) => {
  const id = req.params.id;
  try {
    const product = await deletee(id);
    return res.status(201).json({ product })
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occured" })
  }
}

