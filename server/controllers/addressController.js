import Address from '../models/Address.js';

/**
 * @desc    Get all addresses for authenticated student
 * @route   GET /api/addresses
 * @access  Private (Student)
 */
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new delivery address for student
 * @route   POST /api/addresses
 * @access  Private (Student)
 */
export const createAddress = async (req, res) => {
  try {
    const { label, hostelName, roomNumber, fullAddress, landmark, city, state, postalCode, isDefault } = req.body;

    if (!fullAddress || !fullAddress.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full address is required',
      });
    }

    // If setting as default, clear default status from other user addresses
    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    // Check if this is the user's first address; if so, make default automatically
    const count = await Address.countDocuments({ user: req.user._id });
    const makeDefault = count === 0 ? true : Boolean(isDefault);

    const address = await Address.create({
      user: req.user._id,
      label: label || 'HOSTEL',
      hostelName: hostelName ? hostelName.trim() : '',
      roomNumber: roomNumber ? roomNumber.trim() : '',
      fullAddress: fullAddress.trim(),
      landmark: landmark ? landmark.trim() : '',
      city: city ? city.trim() : '',
      state: state ? state.trim() : '',
      postalCode: postalCode ? postalCode.trim() : '',
      isDefault: makeDefault,
    });

    return res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: address,
    });
  } catch (error) {
    console.error('Error creating address:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create address',
      error: error.message,
    });
  }
};

/**
 * @desc    Update existing address
 * @route   PUT /api/addresses/:id
 * @access  Private (Student)
 */
export const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    const { label, hostelName, roomNumber, fullAddress, landmark, city, state, postalCode, isDefault } = req.body;

    if (isDefault && !address.isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    if (label) address.label = label;
    if (hostelName !== undefined) address.hostelName = hostelName.trim();
    if (roomNumber !== undefined) address.roomNumber = roomNumber.trim();
    if (fullAddress) address.fullAddress = fullAddress.trim();
    if (landmark !== undefined) address.landmark = landmark.trim();
    if (city !== undefined) address.city = city.trim();
    if (state !== undefined) address.state = state.trim();
    if (postalCode !== undefined) address.postalCode = postalCode.trim();
    if (isDefault !== undefined) address.isDefault = Boolean(isDefault);

    await address.save();

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: address,
    });
  } catch (error) {
    console.error('Error updating address:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete an address
 * @route   DELETE /api/addresses/:id
 * @access  Private (Student)
 */
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: error.message,
    });
  }
};
