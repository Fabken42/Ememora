// lib/db.js
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) throw new Error('MONGODB_URI não definida no .env.local')

let cached = global.mongoose || { conn: null, promise: null }

export default async function dbConnect() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then(m => m)
  }

  cached.conn = await cached.promise
  global.mongoose = cached
  return cached.conn
}
