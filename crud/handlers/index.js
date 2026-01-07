import { create, find, findByID, update, deletee } from "../db/queries.js";

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
  const { title, description, price, image } = req.body;

  if (!title || !description || !price) {
    return res.status(403).json({ message: "Input parameters missing." })
  }

  try {
    const product = await create(title, description, price, image);
    return res.status(201).json({ product })
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occured" })
  }
}

export const updateProduct = async (req, res) => {
  const { title, description, price, image } = req.body;
  const id = req.params.id;

  if (!title || !description || !price) {
    return res.status(403).json({ message: "Input parameters missing." })
  }

  try {
    const product = await update(title, description, price, id, image);
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