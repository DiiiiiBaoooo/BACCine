import dbPool from "../config/mysqldb.js";
import cloudinary from "../lib/cloudinary.js";

// Get all services for a specific cinema
export const getServices = async (req, res) => {
  const { cinema_id } = req.params;

  try {
    const [rows] = await dbPool.query(
      `SELECT  cinema_id, name, description, price, quantity, status, image_url, created_at, updated_at 
       FROM services 
       WHERE cinema_id = ? ` ,
      [cinema_id]
    );
    res.json({success:true,services:rows});
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Add a new service
export const addService = async (req, res) => {
  const { cinema_id, name, description, price, quantity, status } = req.body;

  // Validate required fields
  if (!cinema_id || !name || !price || !status) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  // Validate status
  const validStatuses = ['active', 'inactive', 'outofstock'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: "Invalid status value" });
  }

  try {
    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "cinema_services",
      });
      imageUrl = result.secure_url;
    }

    const [result] = await dbPool.query(
      `INSERT INTO services (cinema_id, name, description, price, quantity, status, image_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [cinema_id, name, description || null, price, quantity || 0, status, imageUrl]
    );

    res.json({ success: true, serviceId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update an existing service
export const updateService = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, quantity, status } = req.body;

  // Validate required fields
  if (!name || !price || !status) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  // Validate status
  const validStatuses = ['active', 'inactive', 'outofstock'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: "Invalid status value" });
  }

  try {
    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "cinema_services",
      });
      imageUrl = result.secure_url;
    }

    await dbPool.query(
      `UPDATE services 
       SET name = ?, description = ?, price = ?, quantity = ?, status = ?, 
           image_url = IFNULL(?, image_url), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, description || null, price, quantity || 0, status, imageUrl, id]
    );

    res.json({ success: true, message: "Service updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete a service
export const deleteService = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await dbPool.query(`DELETE FROM services WHERE id = ?`, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Service not found" });
    }
    res.json({ success: true, message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
export const getServiceActive = async (req,res) => {
  const {cinema_id}= req.params;
  try {
    const [rows] = await dbPool.query(
      `SELECT  cinema_id, name, description, price, quantity, image_url, created_at, updated_at 
       FROM services 
       WHERE cinema_id = ? AND status='active' ` ,
      [cinema_id]
    );
    res.json({success:true,services:rows});
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });

  }
  
}