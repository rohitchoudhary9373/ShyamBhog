import mongoose from 'mongoose';

const SocialLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['instagram', 'whatsapp', 'facebook'],
    required: true,
  },
  url: {
    type: String,
    required: true,
    match: [/^https?:\/\//, 'Please provide a valid URL'],
  },
}, { timestamps: true });

export default mongoose.model('SocialLink', SocialLinkSchema);
