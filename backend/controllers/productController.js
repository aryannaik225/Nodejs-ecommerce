import { 
  create, 
  find, 
  findByID, 
  update, 
  deletee, 
  findAllCategories,
  incrementStock,
  decrementStock,
  selectProducts,
  selectProductCategories
} from "../TiDB/product-queries.js";

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
    res.status(500).json({ message: "Error Occurred" })
  }
}

export const getProduct = async (req, res) => {
  const id = req.params.id;
  try {
    const product = await findByID(id);
    return res.status(200).json({ product })
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" })
  }
}

export const createProduct = async (req, res) => {
  const { title, description, price, image, categoryIds=[], stock=0 } = req.body;

  if (!title || !description || !price) {
    return res.status(403).json({ message: "Input parameters missing." })
  }

  try {
    const product = await create(title, description, price, image, categoryIds, stock);
    return res.status(201).json({ product })
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" })
  }
}

export const updateProduct = async (req, res) => {
  const { title, description, price, image, categoryIds, stock } = req.body;
  const id = req.params.id;

  if (!title || !description || !price) {
    return res.status(403).json({ message: "Input parameters missing." })
  }

  try {
    const product = await update(title, description, price, id, image, categoryIds, stock);
    return res.status(201).json({ product })
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" })
  }
}

export const deleteProduct = async (req, res) => {
  const id = req.params.id;
  try {
    const product = await deletee(id);
    return res.status(201).json({ product })
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" })
  }
}

export const manageStock = async (req, res) => {
  const { productId, action, quantity } = req.body;

  if (!productId || !action || !quantity) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    if (action === "add") {
      const updatedProduct = await incrementStock(productId, quantity);
      return res.status(200).json({ message: "Stock added", product: updatedProduct });
    } 
    
    else if (action === "remove") {
      const success = await decrementStock(productId, quantity);
      
      if (success) {
        return res.status(200).json({ message: "Stock removed successfully" });
      } else {
        return res.status(409).json({ message: "Insufficient stock or product not found" });
      }
    } 
    
    else {
      return res.status(400).json({ message: "Invalid action. Use 'add' or 'remove'" });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" });
  }
}

export const selectProductss = async (req, res) => {
  try {
    const products = await selectProducts();
    return res.status(200).json({ products });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" });
  }
}

export const selectProductCategoriess = async (req, res) => {
  try {
    const productCategories = await selectProductCategories();
    return res.status(200).json({ productCategories });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" });
  }
}