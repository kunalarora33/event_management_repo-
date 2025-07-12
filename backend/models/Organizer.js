const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const OrganizerSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['organizer', 'admin'], // <-- NEW: Defines possible roles
        default: 'organizer'          // <-- NEW: Sets a default role for all new accounts
    }
});


OrganizerSchema.pre('save', async function(next) {
    if (!this.isModified('password')) { 
        return next();
    }
    const salt = await bcrypt.genSalt(10); 
    this.password = await bcrypt.hash(this.password, salt); 
    next();
});


OrganizerSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Organizer', OrganizerSchema);