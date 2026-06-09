import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['principal', 'teacher', 'student'], 
    required: true 
  },
  // Reference to the specific profile based on the role
  profileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    // Dynamic referencing can be handled in the application logic
  }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);